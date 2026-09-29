#!/bin/bash
set -e

echo "[*] Starting Metadata SSRF Simulation"

NAMESPACE="devsecops-staging"
# Get the first order-service pod to execute the test from
POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=order-service -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    echo "[-] No order-service pods found. Ensure they are deployed."
    exit 1
fi

echo "[*] Targeting pod: $POD_NAME"
echo "---------------------------------------------------"
echo "[1] Attempting to hit GCP Metadata Server..."

# Expecting this to timeout or connection refused because of the NetworkPolicy
kubectl exec $POD_NAME -n $NAMESPACE -- wget -q --timeout=3 --header="Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token || echo "[+] Metadata access blocked successfully."

echo "---------------------------------------------------"
echo "[*] Metadata SSRF Simulation Complete"
