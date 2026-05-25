terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

resource "tls_private_key" "erp_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "erp_key_pair" {
  key_name   = "erp-cloud-key"
  public_key = tls_private_key.erp_key.public_key_openssh
}

resource "local_file" "private_key" {
  content         = tls_private_key.erp_key.private_key_pem
  filename        = "${path.module}/erp-cloud-key.pem"
}

resource "aws_security_group" "erp_sg" {
  name        = "erp-cluster-sg"
  description = "Security group for Multi-Node Cluster"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Jenkins
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Kubernetes API
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all NodePorts (30000-32767)
  ingress {
    from_port   = 30000
    to_port     = 32767
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Internal Traffic
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "erp_nodes" {
  count         = 3
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.small"
  key_name      = aws_key_pair.erp_key_pair.key_name
  vpc_security_group_ids = [aws_security_group.erp_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name = count.index == 0 ? "K8s-Master-Jenkins" : "K8s-Worker-${count.index}"
  }

  user_data = <<-EOF
              #!/bin/bash
              sudo apt-get update -y
              sudo apt-get install -y docker.io
              sudo systemctl enable docker
              sudo systemctl start docker
              sudo usermod -aG docker ubuntu

              # Install Kubernetes tools
              sudo apt-get install -y apt-transport-https ca-certificates curl
              curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.29/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
              echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.29/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
              sudo apt-get update
              sudo apt-get install -y kubelet kubeadm kubectl
              sudo apt-mark hold kubelet kubeadm kubectl

              # If Master Node, install Jenkins
              if [ "${count.index}" -eq "0" ]; then
                sudo apt-get install -y openjdk-17-jre
                wget -O /usr/share/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
                echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
                sudo apt-get update
                sudo apt-get install -y jenkins
                sudo systemctl enable jenkins
                sudo systemctl start jenkins
              fi
              EOF
}

output "master_ip" {
  value = aws_instance.erp_nodes[0].public_ip
}

output "worker_ips" {
  value = [for i in range(1, 3) : aws_instance.erp_nodes[i].public_ip]
}
