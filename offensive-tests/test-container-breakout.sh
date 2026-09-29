#!/bin/bash
set -e

echo "[*] Starting Container Breakout Simulation"

NAMESPACE="devsecops-staging"
POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=auth-service -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    echo "[-] No auth-service pods found. Ensure they are deployed."
    exit 1
fi

echo "[*] Targeting pod: $POD_NAME"
echo "---------------------------------------------------"

echo "[1] Attempting to write to root filesystem..."
kubectl exec $POD_NAME -n $NAMESPACE -- sh -c 'echo "hacked" > /test.txt' || echo "[+] Write blocked! Root filesystem is Read-Only."

echo "---------------------------------------------------"
echo "[2] Attempting privilege escalation (su)..."
kubectl exec $POD_NAME -n $NAMESPACE -- su - || echo "[+] su blocked/unavailable! Privileged escalation mitigated."

echo "---------------------------------------------------"
echo "[*] Container Breakout Simulation Complete"
