import React, { useState, useEffect } from "react";
import { View, Image, Text } from "react-native";

const TextToImage = ({ prompt }) => {
  const axios = require("axios");
  const [imageUrl, setImageUrl] = useState();
  const [error, setError] = useState();
  const apiUrl = "https://535f-203-145-219-124.ngrok-free.app/generateImage";
  const requestData = {
    prompt: "Cute cat on the bed.", //option types: string or list of strings.
    prompt_style: "photography", //options: "anime", "portraits", "landscape", "sci-fi", "photography", "video_game", None for default.
    negative_prompt: "", //can change to your negative prompt here.
    negative_prompt_style: None, //options: "comic", "basic", "natural_human", None for default.
    n_steps: 40, //generating steps
    high_noise_frac: 0.8, //generating parameters
    base64_string: True, //please set True for api call, False is for testing.
  };

  const headers = {
    "API-KEY": "iisriisra305",
  };

  useEffect(() => {
    if (prompt) {
      axios
        .post(apiUrl, requestData, { headers })
        .then((response) => {
          const imgBase64 = response.data.img_base64_list[0];
          setImageUrl(`data:image/jpeg;base64,${imgBase64}`);
        })
        .catch((error) => {
          console.error("Error:", error);
          setError(error);
        });
    }
  }, [prompt]);

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  if (!imageUrl) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: "100%", height: "100%" }}
        />
      )}
      {error && <Text>Error loading image.</Text>}
    </View>
  );
};

export default TextToImage;
