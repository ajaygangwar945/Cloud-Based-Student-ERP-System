# Master Local DevOps Runbook — Commands Reference

This document contains the exact commands you need to execute to run your entire DevOps stack locally. Follow each section step by step.

---

## 🛠️ Step 1: Enable Local Kubernetes (Docker Desktop)

Instead of using AWS, we will use Docker Desktop's built-in Kubernetes cluster.

1.  **Open Docker Desktop** on your computer.
2.  Click on the **Settings Gear (top right)**.
3.  Navigate to **Kubernetes** on the left menu.
4.  Check the box: **[x] Enable Kubernetes**.
5.  Click **Apply & Restart** (this will download and start the cluster, which takes about 1–2 minutes).
6.  Open your **PowerShell** terminal and run this command to verify it is active:
    ```powershell
    kubectl cluster-info
    ```
    *(You should see "Kubernetes control plane is running...")*

---

## 🏗️ Step 2: Deploy Prometheus & Grafana locally

Deploy your Prometheus and Grafana monitoring stacks directly to your local Kubernetes cluster:

1.  **Deploy Cluster Roles and Service Accounts:**
    ```powershell
    kubectl apply -f monitoring/prometheus-rbac.yaml
    ```
2.  **Deploy ConfigMaps (Prometheus Scrape configurations):**
    ```powershell
    kubectl apply -f monitoring/prometheus-config.yaml
    ```
3.  **Deploy Prometheus Server:**
    ```powershell
    kubectl apply -f monitoring/prometheus-deployment.yaml
    ```
4.  **Deploy Grafana Dashboard:**
    ```powershell
    kubectl apply -f monitoring/grafana-deployment.yaml
    ```
5.  **Verify Pods are Active:**
    ```powershell
    kubectl get pods -n default
    ```
6.  **Access Local Dashboards:**
    *   **Prometheus UI:** Open [http://localhost:30090](http://localhost:30090) in your browser.
    *   **Grafana UI:** Open [http://localhost:3000](http://localhost:3000) in your browser (Login: `admin` / `admin`).

---

## 🚨 Step 3: Run Jenkins Locally with Docker Access

Your pipeline builds and pushes Docker images, so the Jenkins container needs to utilize your host's Docker socket.

1.  **Start local Jenkins inside Docker:**
    Execute this command in your PowerShell terminal to mount your Windows Docker Named Pipe:
    ```powershell
    docker run -d --name local-jenkins `
      -p 8080:8080 -p 50000:50000 `
      -v jenkins_home:/var/jenkins_home `
      -v //./pipe/docker_engine://./pipe/docker_engine `
      -u root `
      jenkins/jenkins:lts
    ```
2.  **Retrieve your Jenkins Admin Password:**
    After Jenkins boots (about 30 seconds), run this command to get the setup password:
    ```powershell
    docker logs local-jenkins
    ```
    *(Look for the long alphanumeric password near the bottom and copy it).*
3.  **Complete the Jenkins Wizard:**
    *   Open [http://localhost:8080](http://localhost:8080) in your browser.
    *   Paste the password and click **Continue**.
    *   Select **Install Suggested Plugins**.
    *   Create your admin user profile.

---

## 🔌 Step 4: Setup local GitHub Webhook (ngrok)

To trigger Jenkins automatically when you push code:

1.  **Expose Jenkins to the internet temporarily:**
    Open a new PowerShell terminal and run:
    ```powershell
    npx -y ngrok http 8080
    ```
    *(Copy the generated `Forwarding` HTTPS URL, for example: `https://abcd-123.ngrok-free.app`)*
2.  **Add Webhook to GitHub:**
    *   Go to your GitHub Repository > **Settings** > **Webhooks** > **Add Webhook**.
    *   **Payload URL:** Paste your ngrok URL and append `/github-webhook/` (e.g. `https://abcd-123.ngrok-free.app/github-webhook/`).
    *   **Content Type:** Select `application/json`.
    *   Click **Add Webhook**.
3.  **Setup Jenkins Job:**
    *   In Jenkins, click **New Item**, name it `Student-ERP`, select **Pipeline**, and click **OK**.
    *   Under **Build Triggers**, check **[x] GitHub hook trigger for GITScm polling**.
    *   Under **Pipeline**, select **Pipeline script from SCM**.
    *   Set SCM to **Git**, paste your Repository URL, and select the branch (e.g., `*/main`).
    *   Click **Save**.

---

## 🐳 Step 5: Save your Docker Hub Credentials in Jenkins

Your pipeline pushes built images to Docker Hub:

1.  Go to Jenkins Dashboard > **Manage Jenkins** > **Credentials** > **System** > **Global credentials** > **Add Credentials**.
2.  **Kind:** `Username with password`.
3.  **Scope:** `Global`.
4.  **Username:** `ajaygangwar945`.
5.  **Password:** *(Your Docker Hub password or access token)*.
6.  **ID:** `docker-hub-credentials` *(Must be exactly this name as defined in your Jenkinsfile)*.
7.  Click **Create**.

---

## 📐 Step 6: Validate Terraform Infrastructure Configuration

Since Terraform manages cloud infrastructure, you can run plan and validation stages locally:

1.  **Install AWS CLI** (if not already installed) and configure your credentials:
    ```powershell
    aws configure
    ```
2.  **Navigate to the Terraform folder:**
    ```powershell
    cd terraform
    ```
3.  **Initialize Terraform providers:**
    ```powershell
    terraform init
    ```
4.  **Validate syntax correctness:**
    ```powershell
    terraform validate
    ```
5.  **Simulate cloud resource provisioning:**
    ```powershell
    terraform plan
    ```
