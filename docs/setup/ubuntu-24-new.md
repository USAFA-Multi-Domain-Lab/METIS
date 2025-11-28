Run this command on a fresh Ubuntu 24.04 install to set up METIS:

```bash
curl -o /tmp/ubuntu-24-installer.sh https://raw.githubusercontent.com/USAFA-Multi-Domain-Lab/METIS-Deployment-Tools/master/ubuntu-24-installer.sh && chmod +x /tmp/ubuntu-24-installer.sh && sudo /tmp/ubuntu-24-installer.sh && rm /tmp/ubuntu-24-installer.sh
```

Once complete, METIS will be set up as a service and will start automatically on boot. You can control the METIS server using the following commands:

```bash
sudo systemctl start metis.service
sudo systemctl stop metis.service
sudo systemctl restart metis.service
sudo systemctl status metis.service
```
