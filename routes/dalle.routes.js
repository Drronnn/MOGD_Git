import express from "express";
import * as dotenv from "dotenv";
import axios from "axios";

const api_key = "76634BE76EBD140DCD5142823A42AE13";
const sec_key = "68AE85E2DA296631130D89866EA7867F";
const url = "https://api-key.fusionbrain.ai/";

const getModel = async () => {
  const response = await fetch(url + "key/api/v1/models", {
    method: "GET",
    headers: {
      "X-Key": "Key " + api_key,
      "X-Secret": "Secret " + sec_key,
    },
  });

  const data = await response.json();

  return data[0].id;
};

const generate = async (modelId, prompt) => {
  const data = new FormData();
  const params = {
    type: "GENERATE",
    numImages: 1,
    width: 768,
    height: 768,
    generateParams: {
      query: prompt,
    },
  };

  data.append(
    "params",
    new Blob([JSON.stringify(params)], { type: "application/json" })
  );
  data.append("model_id", modelId);

  const response = await axios.post(`${url}key/api/v1/text2image/run`, data, {
    headers: {
      "X-Key": `Key ${api_key}`,

      "X-Secret": `Secret ${sec_key}`,

      "Content-Type": "multipart/form-data",
    },
  });

  const res = JSON.stringify(response.data);

  return response.data.uuid;
};

const checkGeneration = async (uuid) => {
  let attempts = 1;
  while (true) {
    const response = await fetch(url + "key/api/v1/text2image/status/" + uuid, {
      method: "GET",
      headers: {
        "X-Key": "Key " + api_key,
        "X-Secret": "Secret " + sec_key,
      },
    });

    const data = await response.json();
    if (data.status == "DONE") return data.images;
    attempts++;
    await sleep(1000);
  }
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

dotenv.config();

const router = express.Router();

router.route("/").get((req, res) => {
  res.status(200).json({ message: "Hello from DALL.E ROUTES" });
});

router.route("/").post(async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("prompt", prompt);
    let id = await getModel();
    let uuid = await generate(id, prompt);
    let images = await checkGeneration(uuid);

    res.status(200).json({ photo: images[0] });
  } catch (error) {
    console.error("error", error.response);
    res.status(500).json({ message: "Something went wrong" });
  }
});

export default router;
