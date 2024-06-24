import React, { useState } from "react";
import { Box, Text, Button, Center, VStack, HStack } from "native-base";
import { TouchableOpacity } from "react-native";
import FlashcardNavigator from "../screens/components/FlashcardNavigator";
import { useTheme } from "./context/ThemeProvider";
import { useNavigation } from '@react-navigation/native';

const FlashcardScreen = () => {
  const { theme, toggleTheme, themes } = useTheme();
  const colors = themes[theme];
  const [showTranslation, setShowTranslation] = useState(false);
  const navigation = useNavigation();

  const flashcards = [
    { word: "Apple", translation: "苹果 (Píngguǒ)" },
    { word: "Banana", translation: "香蕉 (Xiāngjiāo)" },
    { word: "Cat", translation: "猫 (Māo)" },
    { word: "Dog", translation: "狗 (Gǒu)" },
  ];

  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleFlip = () => {
    setShowTranslation(!showTranslation);
  };

  return (
    <Center flex={1} px="3" background={colors.surface}>
      <VStack space={4} alignItems="center">
        <HStack width="100%" justifyContent="space-between" alignItems="center">
          <Box />
          <Button
            onPress={() => navigation.navigate('Quiz')}
            background={colors.primaryContainer}
            _text={{ color: colors.onSurface }}
          >
            Test your abilities
          </Button>
        </HStack>
        <TouchableOpacity onPress={handleFlip}>
          <Box
            width="300px"
            height="200px"
            bg={colors.primaryContainer}
            alignItems="center"
            justifyContent="center"
            borderRadius="10px"
            shadow={2}
          >
            <Text fontSize="2xl" color={colors.onSurface}>
              {showTranslation
                ? flashcards[currentCardIndex].translation
                : flashcards[currentCardIndex].word}
            </Text>
          </Box>
        </TouchableOpacity>
          <FlashcardNavigator
            currentCardIndex={currentCardIndex}
            flashcardsLength={flashcards.length}
            setCurrentCardIndex={setCurrentCardIndex}
            setShowTranslation={setShowTranslation}
          />
      </VStack>
    </Center>
  );
};

export default FlashcardScreen;