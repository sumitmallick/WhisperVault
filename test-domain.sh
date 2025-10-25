#!/bin/bash

echo "🔍 Testing DNS propagation for whispervault.in"
echo "=============================================="

echo ""
echo "📍 DNS Lookup:"
nslookup whispervault.in

echo ""
echo "🌐 Testing Website:"
curl -w "HTTP Status: %{http_code}\n" -s -o /dev/null http://whispervault.in/ || echo "❌ Connection failed - DNS not propagated yet"

echo ""
echo "🔧 Testing API:"
curl -w "HTTP Status: %{http_code}\n" -s http://whispervault.in/api/health || echo "❌ API connection failed - DNS not propagated yet"

echo ""
echo "⏰ If connections fail, wait 10-60 minutes and run this script again"
echo "💫 DNS propagation can take up to 48 hours globally"