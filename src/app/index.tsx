import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

import * as Speech from "expo-speech";

import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const retryingConfirmation = useRef(false);

  // =====================================================
  // SPEAK HOME MESSAGE
  // =====================================================

  const speakHomeMessage = (isFirstVisit = false) => {
    Speech.stop();

    const message = isFirstVisit
      ? "Welcome to VisionPay AI. Tap anywhere to speak."
      : "Payment successful. Tap anywhere to speak.";

    Speech.speak(message, {
      language: "en-IN",
      rate: 0.9,
      onStart: () => {
        console.log("Home speech started");
      },
      onDone: () => {
        console.log("Home speech finished");
      },
      onError: (error) => {
        console.log("Home speech error:", error);
      },
    });
  };

  // =====================================================
  // INITIAL WELCOME MESSAGE
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      speakHomeMessage(true);
    }, 700);

    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, []);

  // =====================================================
  // TAP ANYWHERE ON HOME
  // =====================================================

  const handleHomeTap = () => {
    console.log("HOME SCREEN TAPPED");

    Speech.stop();

    setShowWelcome(false);

    setTimeout(() => {
      startListening();
    }, 250);
  };

  // =====================================================
  // SPEECH START
  // =====================================================

  useSpeechRecognitionEvent("start", () => {
    console.log("Speech recognition started");
    setIsListening(true);
  });

  // =====================================================
  // SPEECH END
  // =====================================================

  useSpeechRecognitionEvent("end", () => {
    console.log("Speech recognition ended");
    setIsListening(false);
  });

  // =====================================================
  // RETRY CONFIRMATION
  // =====================================================

  const retryConfirmation = () => {
    if (retryingConfirmation.current) {
      return;
    }

    retryingConfirmation.current = true;

    console.log(
      "Asking user to speak confirmation again"
    );

    setIsConfirming(false);
    setIsListening(false);

    Speech.stop();

    Speech.speak(
      "Please speak again to confirm or cancel your payment.",
      {
        language: "en-IN",
        rate: 0.9,

        onDone: () => {
          retryingConfirmation.current = false;

          setTimeout(() => {
            startConfirmationListening();
          }, 300);
        },

        onError: () => {
          retryingConfirmation.current = false;

          setTimeout(() => {
            startConfirmationListening();
          }, 300);
        },
      }
    );
  };

  // =====================================================
  // SPEECH ERROR
  // =====================================================

  useSpeechRecognitionEvent("error", (event) => {
    console.log(
      "Speech recognition error:",
      event.error
    );

    console.log(
      "Speech recognition message:",
      event.message
    );

    setIsListening(false);

    if (
      isConfirming &&
      event.error === "no-speech"
    ) {
      retryConfirmation();
      return;
    }

    if (isConfirming) {
      retryConfirmation();
      return;
    }

    if (event.error === "no-speech") {
      setText(
        "No speech detected. Please try again."
      );
    } else {
      setText(
        "Speech recognition error: " +
          event.error
      );
    }
  });

  // =====================================================
  // SPEECH RESULT
  // =====================================================

  useSpeechRecognitionEvent("result", (event) => {
    const transcript =
      event.results[0]?.transcript || "";

    console.log("Speech result:", transcript);

    if (!event.isFinal) {
      return;
    }

    const command =
      transcript.toLowerCase().trim();

    // ===================================================
    // CONFIRMATION MODE
    // ===================================================

    if (isConfirming) {
      console.log(
        "Confirmation command:",
        command
      );

      setIsListening(false);

      // -------------------------------------------------
      // CONFIRM
      // -------------------------------------------------

      if (
        command.includes("confirm") ||
        command.includes("yes") ||
        command.includes("pay")
      ) {
        console.log("PAYMENT CONFIRMED");

        const finalAmount = amount;
        const finalRecipient = recipient;

        Speech.stop();

        setIsConfirming(false);
        setShowConfirmation(false);
        setPaymentSuccessful(true);

        Speech.speak(
          `Payment successful. ${finalAmount} rupees has been sent to ${finalRecipient}.`,
          {
            language: "en-IN",
            rate: 0.9,

            onStart: () => {
              console.log(
                "Success speech started"
              );
            },

            onDone: () => {
              console.log(
                "Success speech finished"
              );

              setPaymentSuccessful(false);
              setShowConfirmation(false);
              setIsConfirming(false);
              setIsListening(false);

              setAmount("");
              setRecipient("");
              setText("");

              // Return to home.
              setShowWelcome(true);

              // Automatically tell user what to do.
              setTimeout(() => {
                Speech.stop();

                Speech.speak(
                  "Payment successful. Tap anywhere to speak.",
                  {
                    language: "en-IN",
                    rate: 0.9,
                  }
                );
              }, 500);
            },

            onError: () => {
              setPaymentSuccessful(false);
              setShowConfirmation(false);
              setIsConfirming(false);
              setIsListening(false);

              setAmount("");
              setRecipient("");
              setText("");

              setShowWelcome(true);

              setTimeout(() => {
                Speech.speak(
                  "Payment successful. Tap anywhere to speak.",
                  {
                    language: "en-IN",
                    rate: 0.9,
                  }
                );
              }, 500);
            },
          }
        );

        return;
      }

      // -------------------------------------------------
      // CANCEL
      // -------------------------------------------------

      if (
        command.includes("cancel") ||
        command.includes("cancelled") ||
        command.includes("canceled") ||
        command.includes("no") ||
        command.includes("stop")
      ) {
        console.log("PAYMENT CANCELLED");

        Speech.stop();

        setIsConfirming(false);
        setIsListening(false);

        Speech.speak(
          "Payment cancelled. Tap anywhere to speak.",
          {
            language: "en-IN",
            rate: 0.9,

            onDone: () => {
              setShowConfirmation(false);
              setPaymentSuccessful(false);
              setIsConfirming(false);

              setAmount("");
              setRecipient("");
              setText("");

              setShowWelcome(true);
            },

            onError: () => {
              setShowConfirmation(false);
              setPaymentSuccessful(false);
              setIsConfirming(false);

              setAmount("");
              setRecipient("");
              setText("");

              setShowWelcome(true);
            },
          }
        );

        return;
      }

      // -------------------------------------------------
      // UNKNOWN CONFIRMATION COMMAND
      // -------------------------------------------------

      console.log(
        "Unknown confirmation command"
      );

      retryConfirmation();

      return;
    }

    // ===================================================
    // NORMAL PAYMENT MODE
    // ===================================================

    setText(transcript);

    const numberMatch =
      transcript.match(/\d+/);

    const recipientMatch =
      transcript.match(
        /\bto\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i
      );

    console.log(
      "Amount match:",
      numberMatch
    );

    console.log(
      "Recipient match:",
      recipientMatch
    );

    if (
      numberMatch &&
      recipientMatch
    ) {
      const detectedAmount =
        numberMatch[0];

      const detectedRecipient =
        recipientMatch[1].trim();

      console.log(
        "Amount detected:",
        detectedAmount
      );

      console.log(
        "Recipient detected:",
        detectedRecipient
      );

      setAmount(detectedAmount);
      setRecipient(detectedRecipient);

      setShowConfirmation(true);
      setPaymentSuccessful(false);

      Speech.stop();

      Speech.speak(
        `You are about to pay ${detectedAmount} rupees to ${detectedRecipient}. Say confirm to continue or cancel to stop.`,
        {
          language: "en-IN",
          rate: 0.9,

          onStart: () => {
            console.log(
              "Confirmation message started"
            );
          },

          onDone: () => {
            console.log(
              "Confirmation message finished"
            );

            setTimeout(() => {
              startConfirmationListening();
            }, 300);
          },

          onError: () => {
            setTimeout(() => {
              startConfirmationListening();
            }, 300);
          },
        }
      );
    } else {
      setText(
        'Please say something like "Pay 500 to Rahul".'
      );

      Speech.stop();

      Speech.speak(
        "Please say something like Pay 500 to Rahul.",
        {
          language: "en-IN",
          rate: 0.9,
        }
      );
    }
  });

  // =====================================================
  // START NORMAL LISTENING
  // =====================================================

  const startListening = async () => {
    console.log("START LISTENING");

    if (isListening) {
      return;
    }

    if (
      showConfirmation ||
      paymentSuccessful
    ) {
      return;
    }

    try {
      Speech.stop();

      setText("");

      const permission =
        await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();

      console.log(
        "MICROPHONE PERMISSION:",
        permission
      );

      if (!permission.granted) {
        console.log(
          "MICROPHONE PERMISSION DENIED"
        );

        setText(
          "Microphone permission denied."
        );

        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: "en-IN",
        interimResults: true,
        continuous: false,
        maxAlternatives: 5,
      });
    } catch (error) {
      console.log(
        "START LISTENING ERROR:",
        error
      );

      setIsListening(false);
    }
  };

  // =====================================================
  // START CONFIRMATION LISTENING
  // =====================================================

  const startConfirmationListening =
    async () => {
      console.log(
        "STARTING CONFIRMATION LISTENING"
      );

      try {
        const permission =
          await ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();

        if (!permission.granted) {
          console.log(
            "Microphone permission denied"
          );

          setIsConfirming(false);
          return;
        }

        setIsConfirming(true);
        setIsListening(false);

        ExpoSpeechRecognitionModule.start({
          lang: "en-IN",
          interimResults: false,
          continuous: false,
          maxAlternatives: 5,
        });
      } catch (error) {
        console.log(
          "CONFIRMATION ERROR:",
          error
        );

        setIsConfirming(false);

        retryConfirmation();
      }
    };

  // =====================================================
  // CONFIRM BUTTON
  // =====================================================

  const confirmPayment = () => {
    console.log(
      "CONFIRM BUTTON PRESSED"
    );

    const finalAmount = amount;
    const finalRecipient = recipient;

    Speech.stop();

    setIsConfirming(false);
    setIsListening(false);

    setShowConfirmation(false);
    setPaymentSuccessful(true);

    Speech.speak(
      `Payment successful. ${finalAmount} rupees has been sent to ${finalRecipient}.`,
      {
        language: "en-IN",
        rate: 0.9,

        onDone: () => {
          setPaymentSuccessful(false);
          setShowConfirmation(false);
          setIsConfirming(false);
          setIsListening(false);

          setAmount("");
          setRecipient("");
          setText("");

          setShowWelcome(true);

          setTimeout(() => {
            Speech.speak(
              "Payment successful. Tap anywhere to speak.",
              {
                language: "en-IN",
                rate: 0.9,
              }
            );
          }, 500);
        },

        onError: () => {
          setPaymentSuccessful(false);
          setShowConfirmation(false);
          setIsConfirming(false);
          setIsListening(false);

          setAmount("");
          setRecipient("");
          setText("");

          setShowWelcome(true);

          setTimeout(() => {
            Speech.speak(
              "Payment successful. Tap anywhere to speak.",
              {
                language: "en-IN",
                rate: 0.9,
              }
            );
          }, 500);
        },
      }
    );
  };

  // =====================================================
  // CANCEL BUTTON
  // =====================================================

  const cancelPayment = () => {
    console.log(
      "CANCEL BUTTON PRESSED"
    );

    Speech.stop();

    setIsConfirming(false);
    setIsListening(false);

    Speech.speak(
      "Payment cancelled. Tap anywhere to speak.",
      {
        language: "en-IN",
        rate: 0.9,

        onDone: () => {
          setShowConfirmation(false);
          setPaymentSuccessful(false);
          setIsConfirming(false);

          setAmount("");
          setRecipient("");
          setText("");

          setShowWelcome(true);
        },

        onError: () => {
          setShowConfirmation(false);
          setPaymentSuccessful(false);
          setIsConfirming(false);

          setAmount("");
          setRecipient("");
          setText("");

          setShowWelcome(true);
        },
      }
    );
  };

  // =====================================================
  // HOME SCREEN
  // =====================================================

  const renderHome = () => {
    return (
      <Pressable
        style={styles.home}
        onPress={handleHomeTap}
      >
        <Text style={styles.title}>
          VisionPay AI
        </Text>

        <Text style={styles.subtitle}>
          AI Voice Payment Assistant
        </Text>

        <View style={styles.micButton}>
          <Text style={styles.micIcon}>
            🎤
          </Text>
        </View>

        <Text style={styles.welcomeText}>
          Welcome to VisionPay AI
        </Text>

        <Text style={styles.tapText}>
          Tap anywhere to speak
        </Text>

        <Text style={styles.smallText}>
          Voice-powered payment assistant
        </Text>

        {text !== "" && (
          <View style={styles.commandBox}>
            <Text style={styles.commandLabel}>
              You said
            </Text>

            <Text style={styles.commandText}>
              {text}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  // =====================================================
  // CONFIRMATION SCREEN
  // =====================================================

  const renderConfirmation = () => {
    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Text style={styles.heading}>
            Confirm Payment
          </Text>

          <Text style={styles.label}>
            Recipient
          </Text>

          <Text style={styles.value}>
            {recipient}
          </Text>

          <Text style={styles.label}>
            Amount
          </Text>

          <Text style={styles.amount}>
            ₹{amount}
          </Text>

          <Pressable
            style={styles.confirmButton}
            onPress={confirmPayment}
          >
            <Text style={styles.buttonText}>
              {isConfirming
                ? "LISTENING..."
                : "CONFIRM PAYMENT"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={cancelPayment}
          >
            <Text style={styles.cancelText}>
              CANCEL
            </Text>
          </Pressable>

          <Text style={styles.hint}>
            {isConfirming
              ? 'Say "confirm" or "cancel"'
              : "Preparing voice confirmation..."}
          </Text>
        </View>
      </View>
    );
  };

  // =====================================================
  // SUCCESS SCREEN
  // =====================================================

  const renderSuccess = () => {
    return (
      <View style={styles.screen}>
        <View style={styles.successCircle}>
          <Text style={styles.check}>
            ✓
          </Text>
        </View>

        <Text style={styles.successTitle}>
          Payment Successful
        </Text>

        <Text style={styles.successAmount}>
          ₹{amount}
        </Text>

        <Text style={styles.successText}>
          Sent to {recipient}
        </Text>

        <ActivityIndicator
          size="small"
          style={{ marginTop: 25 }}
        />

        <Text style={styles.returnText}>
          Returning to Home...
        </Text>
      </View>
    );
  };

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {showWelcome &&
        !showConfirmation &&
        !paymentSuccessful &&
        renderHome()}

      {!showWelcome &&
        !showConfirmation &&
        !paymentSuccessful &&
        renderHome()}

      {showConfirmation &&
        !paymentSuccessful &&
        renderConfirmation()}

      {paymentSuccessful &&
        renderSuccess()}
    </View>
  );
}

// =======================================================
// STYLES
// =======================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  home: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  title: {
    color: "#111827",
    fontSize: 34,
    fontWeight: "800",
  },

  subtitle: {
    color: "#6B7280",
    fontSize: 16,
    marginTop: 8,
  },

  micButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 45,
  },

  micIcon: {
    fontSize: 55,
  },

  welcomeText: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 35,
    textAlign: "center",
  },

  tapText: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
    textAlign: "center",
  },

  smallText: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 15,
  },

  commandBox: {
    width: "90%",
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 14,
    marginTop: 25,
  },

  commandLabel: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 5,
  },

  commandText: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },

  heading: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 25,
  },

  label: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 10,
  },

  value: {
    color: "#111827",
    fontSize: 23,
    fontWeight: "700",
    marginTop: 5,
  },

  amount: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 5,
    marginBottom: 25,
  },

  confirmButton: {
    width: "100%",
    backgroundColor: "#111827",
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  cancelButton: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },

  cancelText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "800",
  },

  hint: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 18,
    textAlign: "center",
  },

  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },

  check: {
    color: "#FFFFFF",
    fontSize: 55,
    fontWeight: "800",
  },

  successTitle: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
  },

  successAmount: {
    color: "#111827",
    fontSize: 42,
    fontWeight: "800",
    marginTop: 20,
  },

  successText: {
    color: "#6B7280",
    fontSize: 18,
    marginTop: 5,
  },

  returnText: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 10,
  },
});