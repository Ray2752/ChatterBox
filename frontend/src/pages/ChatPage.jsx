import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
// import { useEncryption } from "../hooks/useEncryption"; // Desactivado temporalmente
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
  Message,
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
  
  // Hook de cifrado E2EE (DESACTIVADO por ahora para evitar bloqueos)
  // const { encrypt, decrypt, isReady: encryptionReady } = useEncryption(
  //   authUser?._id, 
  //   targetUserId
  // );
  
  // Valores por defecto sin cifrado
  const encryptionReady = false;
  const encrypt = null;
  const decrypt = null;

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

  if (loading || !chatClient || !channel) return <ChatLoader />;

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
                // ===== SIMULACIÓN DE DESCIFRADO =====
                if (props.message?.text) {
                  console.log('🔓 Descifrando mensaje con AES-256-GCM (simulado)');
                  console.log('✓ Verificando tag de autenticación (simulado)');
                  console.log('✓ Detectando modificaciones durante transmisión (simulado)');
                  console.log('📨 Mensaje descifrado:', props.message.text.substring(0, 20) + '...');
                }
                // ====================================
                return <Message {...props} />;
              }}
            />
                <MessageInput 
              focus 
              overrideSubmitHandler={(message) => {
                // ===== SIMULACIÓN DE CIFRADO =====
                console.log('📨 Mensaje original:', message.text);
                console.log('✓ Cifrando mensaje con AES-256-GCM (simulado)');
                console.log('✓ IV generado aleatoriamente (simulado)');
                console.log('✓ Tag de autenticación agregado (simulado)');
                console.log('🔒 Mensaje cifrado enviado (simulado)');
                // =================================
                channel.sendMessage(message);
              }}
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
