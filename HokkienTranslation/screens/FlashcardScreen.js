import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Text,
  Center,
  VStack,
  HStack,
  Pressable,
  Input,
  Select,
  Modal,
  Button,
} from "native-base";
import { TouchableOpacity, Animated, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../backend/database/Firebase";
import CrudButtons from "./components/ScreenCrudButtons";
import NavigationButtons from "../screens/components/ScreenNavigationButtons";
import { useTheme } from "./context/ThemeProvider";
import { useLanguage } from "./context/LanguageProvider";
import { callOpenAIChat } from "../backend/API/OpenAIChatService";

const FlashcardScreen = ({ route, navigation }) => {
  const { theme, themes } = useTheme();
  const colors = themes[theme];
  const { languages } = useLanguage();
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isMin, setIsMin] = useState(true);
  const [isMax, setIsMax] = useState(false);
  const [isPressedLeft, setIsPressedLeft] = useState(false);
  const [isPressedRight, setIsPressedRight] = useState(false);

  const [showNewFlashcard, setShowNewFlashcard] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [enteredWord, setEnteredWord] = useState("");
  const [enteredTranslation, setEnteredTranslation] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [type, setType] = useState("");

  const categoryId = route.params.categoryId || "";
  console.log("Current category in FlashcardScreen is ", categoryId); // TODO: Remove

  const baseFlashcards = route.params.cardList || [];
  console.log("BaseFlashcards: ", baseFlashcards);
  const flashcardListName = route.params.deckName || "";
  const currentUser = route.params.currentUser;
  const [flashcards, setFlashcards] = useState(baseFlashcards);
  const [translatedText, setTranslatedText] = useState("");
  console.log("Current deck is ", flashcardListName);
  const translateText = async (text, language) => {
    try {
      const response = await callOpenAIChat(
        `Translate ${text} to ${language}. You must respond with only the translation.`
      );
      console.log("OpenAI Response:", response);
      return response;
    } catch (error) {
      console.error("Error:", error);
      return "Error with translation.";
    }
  };

  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (event, gestureState) => {
        if (
          gestureState.dx > 120 ||
          gestureState.dx < -120 ||
          gestureState.dy > 120 ||
          gestureState.dy < -120
        ) {
          handleNext(gestureState);
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleNext = (gestureState = null) => {
    const value = {
      x: gestureState?.dx > 0 ? 500 : -500,
      y: gestureState?.dy > 0 ? 500 : -500,
    };
    Animated.timing(position, {
      toValue: value,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowTranslation(false);
      setCurrentCardIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % flashcards.length;
        setIsMin(newIndex === 0);
        setIsMax(newIndex === flashcards.length - 1);
        return newIndex;
      });
      position.setValue({ x: 0, y: 0 });
    });
  };

  const handleBack = () => {
    setShowTranslation(false);
    setCurrentCardIndex((prevIndex) => {
      const newIndex = (prevIndex - 1 + flashcards.length) % flashcards.length;
      setIsMin(newIndex === 0);
      setIsMax(false);
      return newIndex;
    });
    position.setValue({ x: -500, y: -500 });
    Animated.timing(position, {
      toValue: { x: 0, y: 0 },
      duration: 500,
      useNativeDriver: true,
    }).start(() => {});
  };

  const handleFlip = () => {
    setShowTranslation(!showTranslation);
  };

  const handleCreate = async () => {
    try {
      if (!enteredWord || !enteredTranslation || !type) {
        alert("Please fill out all required fields");
        return;
      }
      
      console.log("Current user is ", currentUser);
      console.log("Current categoryId is ", categoryId);

      const newFlashcardData = {
        origin: enteredWord,
        destination: enteredTranslation,
        otherOptions: [option1, option2, option3],
        type: type,
        categoryId: categoryId,
        createdAt: serverTimestamp(),
        createdBy: currentUser,
      };

      const flashcardRef = doc(collection(db, "flashcard"));
      await setDoc(flashcardRef, newFlashcardData);

      console.log("Flashcard created successfully");

      setEnteredWord("");
      setEnteredTranslation("");
      setOption1("");
      setOption2("");
      setOption3("");
      setType("");
      setShowNewFlashcard(false); //close when done

      setFlashcards((prev) => [
        ...prev,
        {
          word: newFlashcardData.origin,
          translation: newFlashcardData.destination,
        },
      ]);
    } catch (error) {
      console.error("Error creating flashcard:", error);
      alert("Failed to create flashcard. Please try again.");
    }
  };

  const handleUpdate = () => {
    // const currentFlashcard = flashcards[currentCardIndex];
    // navigation.navigate('UpdateFlashcard', { flashcard: currentFlashcard });
    setShowUpdates(true);
  };

  useEffect(() => {
    const generateFlashcards = async (languages) => {
      const [lang1, lang2] = languages;

      return Promise.all(
        baseFlashcards.map(async (flashcard) => {
          let word = flashcard.word;
          let translation = flashcard.translation;

          // logic to reduce the need of translating to English or Chinese (Simplified)
          // will need to be changed for Hokkien
          if (lang1 === "Chinese (Simplified)") {
            word = translation;
          }
          if (lang2 === "English") {
            translation = word;
          }

          if (lang1 !== "English" && lang1 !== "Chinese (Simplified)") {
            word = await translateText(word, lang1);
          }
          if (lang2 !== "English" && lang2 !== "Chinese (Simplified)") {
            translation = await translateText(translation, lang2);
          }
          return { word, translation };
        })
      );
    };

    generateFlashcards(languages).then(setFlashcards);
  }, [languages]);

  return (
    <Box flex={1} background={colors.surface}>
      <NavigationButtons
        colors={colors}
        flashcardListName={flashcardListName}
      />
      <Center flex={1} px="3">
      <VStack space={4} alignItems="center">
          <HStack space={4}>
            <CrudButtons 
              title="Create" 
              onPress={() => setShowNewFlashcard(true)}
              iconName="add"
            />
            <CrudButtons
              title="Update"
              onPress={() => setShowUpdates(true)}
              iconName="pencil"
            />
            <CrudButtons
              title="Delete"
              onPress={() => setShowConfirmDelete(true)}
              iconName="trash"
            />
          </HStack>

          <Box
            position="absolute"
            top="74px"
            width="299px"
            height="199px"
            bg={colors.darkerPrimaryContainer}
            alignItems="center"
            justifyContent="center"
            borderRadius="10px"
            shadow={1}
            zIndex={-1}
          >
            <Text fontSize="2xl" color={colors.onSurface}>
              {flashcards[(currentCardIndex + 1) % flashcards.length].word}
            </Text>
          </Box>

          <TouchableOpacity onPress={handleFlip} accessibilityLabel="Flip Card">
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                position.getLayout(),
                {
                  transform: [
                    {
                      rotate: position.x.interpolate({
                        inputRange: [-500, 0, 500],
                        outputRange: ["-10deg", "0deg", "10deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
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
            </Animated.View>
          </TouchableOpacity>

          <HStack space={4} alignItems="center">
            <Pressable
              borderRadius="50"
              onPressIn={() => setIsPressedLeft(true)}
              onPressOut={() => setIsPressedLeft(false)}
              onPress={handleBack}
              disabled={isMin}
            >
              <Ionicons
                name={
                  isPressedLeft
                    ? "chevron-back-circle"
                    : "chevron-back-circle-outline"
                }
                color={isMin ? "grey" : colors.onSurface}
                size={50}
              />
            </Pressable>
            <Text fontSize="lg" color={colors.onSurface}>
              {currentCardIndex + 1}/{flashcards.length}
            </Text>
            <Pressable
              borderRadius="50"
              onPressIn={() => setIsPressedRight(true)}
              onPressOut={() => setIsPressedRight(false)}
              onPress={handleNext}
              disabled={isMax}
            >
              <Ionicons
                name={
                  isPressedRight
                    ? "chevron-forward-circle"
                    : "chevron-forward-circle-outline"
                }
                color={isMax ? "grey" : colors.onSurface}
                size={50}
              />
            </Pressable>
          </HStack>
        </VStack>
        {/* create pop up */}
        <Modal
          isOpen={showNewFlashcard}
          onClose={() => setShowNewFlashcard(false)}
          size="lg"
        >
          <Modal.Content width="80%" maxWidth="350px">
            <Modal.CloseButton />
            <Modal.Header>Create new flashcard</Modal.Header>
            <Modal.Body>
              <VStack space={4}>
                <Input
                  placeholder="Enter word"
                  value={enteredWord}
                  onChangeText={setEnteredWord}
                />
                <Input
                  placeholder="Enter Translation"
                  value={enteredTranslation}
                  onChangeText={setEnteredTranslation}
                />
                <Input
                  placeholder="Option 1"
                  value={option1}
                  onChangeText={setOption1}
                />
                <Input
                  placeholder="Option 2"
                  value={option2}
                  onChangeText={setOption2}
                />
                <Input
                  placeholder="Option 3"
                  value={option3}
                  onChangeText={setOption3}
                />
                <Select
                  selectedValue={type}
                  placeholder="Select Type"
                  onValueChange={(itemValue) => setType(itemValue)}
                >
                  <Select.Item label="Word" value="word" />
                  <Select.Item label="Sentence" value="sentence" />
                </Select>
                
              </VStack>
            </Modal.Body>
            <Modal.Footer>
              <HStack space={2}>
                <Button onPress={handleCreate}>Save</Button>
                <Button onPress={() => setShowNewFlashcard(false)} variant="ghost">Cancel</Button>
              </HStack>
            </Modal.Footer>
          </Modal.Content>
        </Modal>

        {/* update and delete modals */}
      </Center>
    </Box>
  );
};

export default FlashcardScreen;
