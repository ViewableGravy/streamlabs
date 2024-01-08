import { initializeSLOBSClient } from "./client";

//api docs
//https://stream-labs.github.io/streamlabs-desktop-api-docs/docs/index.html
async function main() {
  const { makeRequestAsync } = await initializeSLOBSClient('http://192.168.20.24:59650/api');

  //wait 5 seconds
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const result = await makeRequestAsync({
    method: "getScenes",
    params: {
      resource: "ScenesService"
    }
  });

  console.log(result)

  process.exit(0);
};

main();