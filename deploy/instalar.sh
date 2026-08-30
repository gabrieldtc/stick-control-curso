#!/bin/bash
set -e

SEU_DOMINIO="$1"

if [ -z "$SEU_DOMINIO" ]; then
    echo "Uso: sudo bash instalar.sh seu-curso.duckdns.org"
    exit 1
fi

echo "==> [1/7] Atualizando sistema..."
apt-get update -y && apt-get upgrade -y

echo "==> [2/7] Instalando Node.js 22..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi
echo "Node: $(node -v)"

echo "==> [3/7] Instalando Nginx..."
apt-get install -y nginx

echo "==> [4/7] Copiando o projeto..."
mkdir -p /opt/travesseiro-groove
cp -r /root/travesseiro-groove/* /opt/travesseiro-groove/ || cp -r ./travesseiro-groove/* /opt/travesseiro-groove/
cd /opt/travesseiro-groove
rm -rf node_modules
npm install --omit=dev

echo "==> [5/7] Criando serviço do systemd..."
cp /root/deploy/travesseiro-groove.service /etc/systemd/system/ 2>/dev/null || cp ./deploy/travesseiro-groove.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable travesseiro-groove
systemctl start travesseiro-groove
sleep 2
systemctl status travesseiro-groove --no-pager

echo "==> [6/7] Configurando Nginx (proxy reverso)..."
cp /root/deploy/nginx.conf /etc/nginx/sites-available/travesseiro-groove 2>/dev/null || cp ./deploy/nginx.conf /etc/nginx/sites-available/travesseiro-groove
ln -sf /etc/nginx/sites-available/travesseiro-groove /etc/nginx/sites-enabled/travesseiro-groove
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> [7/7] Configurando HTTPS com certbot..."
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d "$SEU_DOMINIO" --redirect --non-interactive --agree-tos -m "admin@$SEU_DOMINIO"
systemctl reload nginx

echo ""
echo "==> CONCLUÍDO! Seu site está no ar em:"
echo "    https://$SEU_DOMINIO"
