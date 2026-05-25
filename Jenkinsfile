pipeline {
    agent any

    environment {
        // Securely fetch Docker Hub credentials from Jenkins credentials manager
        DOCKER_CREDS = credentials('docker-hub-credentials') 
        DOCKER_USER  = 'ajaygangwar945'
        
        DOCKER_BACKEND  = 'student-erp-backend'
        DOCKER_FRONTEND = 'student-erp-frontend'
    }

    stages {
        stage('Pull Code') {
            steps {
                // Jenkins automatically pulls the repository triggered by the GitHub Webhook
                checkout scm
            }
        }

        stage('Run Tests') {
            steps {
                echo 'Running unit and integration tests...'
                // Add test scripts here (e.g. npm test)
            }
        }

        stage('Docker Hub Login') {
            steps {
                // Secure password-stdin authentication to prevent exposing keys in build logs
                sh 'echo $DOCKER_CREDS_PSW | docker login -u $DOCKER_CREDS_USR --password-stdin'
            }
        }

        stage('Build Docker Images') {
            steps {
                // Build and tag with both 'latest' and unique 'BUILD_NUMBER' for strict build auditing
                dir('backend') {
                    sh "docker build -t ${DOCKER_USER}/${DOCKER_BACKEND}:latest -t ${DOCKER_USER}/${DOCKER_BACKEND}:${BUILD_NUMBER} ."
                }
                dir('frontend') {
                    sh "docker build -t ${DOCKER_USER}/${DOCKER_FRONTEND}:latest -t ${DOCKER_USER}/${DOCKER_FRONTEND}:${BUILD_NUMBER} ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                // Push both images and tags to the registry
                sh "docker push ${DOCKER_USER}/${DOCKER_BACKEND}:latest"
                sh "docker push ${DOCKER_USER}/${DOCKER_BACKEND}:${BUILD_NUMBER}"
                
                sh "docker push ${DOCKER_USER}/${DOCKER_FRONTEND}:latest"
                sh "docker push ${DOCKER_USER}/${DOCKER_FRONTEND}:${BUILD_NUMBER}"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                // Apply configuration resources (ConfigMaps, Services, NodePorts, nodeSelectors)
                sh 'kubectl apply -f k8s/'
                
                // Rollout updates on the active cluster targeting the exact build tag
                sh "kubectl set image deployment/backend backend=${DOCKER_USER}/${DOCKER_BACKEND}:${BUILD_NUMBER}"
                sh "kubectl set image deployment/frontend frontend=${DOCKER_USER}/${DOCKER_FRONTEND}:${BUILD_NUMBER}"
                
                // Track rollout progress
                sh 'kubectl rollout status deployment/backend'
                sh 'kubectl rollout status deployment/frontend'
            }
        }
    }

    post {
        always {
            // Clean up workspace images to prevent running out of host storage
            sh "docker rmi ${DOCKER_USER}/${DOCKER_BACKEND}:${BUILD_NUMBER} || true"
            sh "docker rmi ${DOCKER_USER}/${DOCKER_FRONTEND}:${BUILD_NUMBER} || true"
        }
        success {
            echo "🎉 Pipeline Build #${BUILD_NUMBER} Completed Successfully!"
        }
        failure {
            echo "❌ Pipeline Build #${BUILD_NUMBER} Failed. Check console logs."
        }
    }
}
