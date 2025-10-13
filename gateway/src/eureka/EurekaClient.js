import { Eureka } from "@rocketsoftware/eureka-js-client";

export class EurekaClient {
  constructor({ name, host, ipAddr, port, eurekaHost, eurekaPort }) {
    this.client = new Eureka({
      instance: {
        instanceId: `${name}:${host}:${port}`,
        app: name.toUpperCase(),
        hostName: host,
        ipAddr: ipAddr,
        vipAddress: `app.${name}.com`,
        status: "UP",
        port: {
          $: port,
          "@enabled": "true",
        },
        dataCenterInfo: {
          "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
          name: "MyOwn",
        },
        homePageUrl: `http://${host}:${port}/`,
        statusPageUrl: `http://${host}:${port}/status`,
        healthCheckUrl: `http://${host}:${port}/health`,
      },

      eureka: {
        host: eurekaHost,
        port: eurekaPort,
        servicePath: "/eureka/apps/",
        maxRetries: 5,
        requestRetryDelay: 5000,
      },
    });
  }

  start() {
    this.client.start((error) => {
      if (error) {
        console.error("❌ Error starting the Eureka Client", error);
      } else {
        console.log("✅ Eureka registration successful");
      }
    });
  }

  stop() {
    this.client.stop();
  }
}
