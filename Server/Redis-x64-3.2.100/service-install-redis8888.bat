redis-server --service-stop --service-name redis8888
redis-server --service-uninstall --service-name redis8888
redis-server --service-install redis.windows.conf --service-name redis8888
redis-server --service-start --service-name redis8888

pause