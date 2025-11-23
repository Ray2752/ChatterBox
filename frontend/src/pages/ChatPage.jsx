import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useEncryption } from "../hooks/useEncryption";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import Navbar from "../components/Navbar";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const { authUser } = useAuthUser();
  
  // Hook de cifrado E2EE
  const { encrypt, decrypt, isReady: encryptionReady, loading: encryptionLoading } = useEncryption(
    authUser?._id, 
    targetUserId
  );

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();

        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  // Función para enviar mensajes cifrados
  const handleSendMessage = useCallback(async (message) => {
    try {
      if (!encryptionReady) {
        toast.error("Encryption not ready yet");
        return;
      }

      const plainText = message.text || "";
      
      // Cifrar el mensaje
      const encryptedText = await encrypt(plainText);
      
      // Enviar mensaje cifrado con metadata
      await channel.sendMessage({
        text: encryptedText,
        encrypted: true, // Flag para saber que está cifrado
        originalLength: plainText.length // Para debugging
      });
      
      console.log("🔒 Message encrypted and sent");
    } catch (error) {
      console.error("Error sending encrypted message:", error);
      toast.error("Failed to send message");
    }
  }, [encryptionReady, encrypt, channel]);

  if (loading || !chatClient || !channel || encryptionLoading) return <ChatLoader />;

  return (
    <>
      <Navbar />
      <div className="h-[93vh]">
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <div className="w-full relative">
              <CallButton handleVideoCall={handleVideoCall} />
              <Window>
                <ChannelHeader />
                <MessageList 
                  Message={(props) => {
                    const message = props.message;
                    
                    // Si el mensaje está cifrado, mostrar indicador
                    if (message.encrypted && encryptionReady) {
                      // Intentar descifrar
                      decrypt(message.text)
                        .then((decryptedText) => {
                          // Actualizar localmente
                          message._decryptedText = decryptedText;
                        })
                        .catch(() => {
                          message._decryptedText = "[Decryption failed]";
                        });
                      
                      // Mostrar texto descifrado o placeholder
                      const displayText = message._decryptedText || "🔒 Decrypting...";
                      
                      return (
                        <div className="str-chat__message">
                          <div className="str-chat__message-text">
                            <p>{displayText}</p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Renderizar mensaje normal
                    return <div className="str-chat__message">
                      <div className="str-chat__message-text">
                        <p>{message.text}</p>
                      </div>
                    </div>;
                  }}
                />
                <MessageInput 
                  focus 
                  overrideSubmitHandler={handleSendMessage}
                />
              </Window>
            </div>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </>
  );
};

export default ChatPage;
