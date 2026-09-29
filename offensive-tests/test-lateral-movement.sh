#!/bin/bash
set -e

echo "[*] Starting Lateral Movement Simulation"

NAMESPACE="devsecops-staging"

# Create a temporary debug pod in the namespace
kubectl run attacker-pod --image=nicolaka/netshoot --namespace=$NAMESPACE --restart=Never -- sleep 3600
echo "[*] Waiting for attacker-pod to be ready..."
kubectl wait --for=condition=ready pod/attacker-pod -n $NAMESPACE --timeout=30s

echo "---------------------------------------------------"
echo "[1] Attempting to reach Auth Service (Should FAIL due to Default Deny)"
kubectl exec attacker-pod -n $NAMESPACE -- curl -s --max-time 3 http://auth-service:8080/health || echo "[+] Connection blocked successfully."

echo "---------------------------------------------------"
echo "[2] Attempting to reach Order Service (Should FAIL)"
kubectl exec attacker-pod -n $NAMESPACE -- curl -s --max-time 3 http://order-service:8081/health || echo "[+] Connection blocked successfully."

echo "---------------------------------------------------"
echo "[3] Attempting to reach Kubernetes API (Should FAIL)"
kubectl exec attacker-pod -n $NAMESPACE -- curl -sk --max-time 3 https://kubernetes.default.svc || echo "[+] Connection blocked successfully."

echo "---------------------------------------------------"
echo "[*] Cleaning up attacker-pod..."
kubectl delete pod attacker-pod -n $NAMESPACE --force --grace-period=0

echo "[*] Lateral Movement Simulation Complete"
