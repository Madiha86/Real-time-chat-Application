import React, { useState, useEffect } from 'react';
import {
        View,
        Text,
        StyleSheet,
        TextInput,
        Pressable,
        KeyboardAvoidingView,
        Platform,
        Image,
        Alert
}
        from 'react-native';
import { SimpleLineIcons, Feather, MaterialCommunityIcons, AntDesign, Ionicons }
        from '@expo/vector-icons';
import { DataStore } from '@aws-amplify/datastore';
import { ChatRoom, Message} from '../../src/models';
import { Auth, Storage } from 'aws-amplify';
import EmojiSelector from 'react-native-emoji-selector';
import * as  ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Audio, AVPlaybackStatus  } from 'expo-av';
import AudioPlayer from '../AudioPlayer';
import MessageComponent  from '../Message';
import { ChatRoomUser } from '../../src/models';
import { box } from "tweetnacl";
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation';
 import {encrypt, getMySecretKey, stringToUint8Array} from '../../utils/crypto';


const MessageInput = ({ chatRoom, messageReplyTo , removeMessageReplyTo}) => {
        const [message, setMessage] = useState('');
        const [isEmojiePickerOpen, setIsEmojiePickerOpen] = useState(false);
        const [image, setImage] = useState<string | null>(null);
        const [progress, setProgress] = useState(0);
        const [recording, setRecording] = useState<Audio.Recording | null>(null);
        const [sound, setSound] = useState<Audio.Sound | null>(null);
        const [paused, setPause] = useState(true);
        const [audioProgress, setAudioProgress] = useState(0);
        const [audioDuration, setAudioDuration] = useState(0);
        const [soundURI, setSoundURI] = useState<string | null>(null);

        const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();



        useEffect(() => {
                (async () => {
                        if (Platform.OS !== "web") {
                                const libraryResponse =
                                        await ImagePicker.requestMediaLibraryPermissionsAsync();
                                const photoResponse = await ImagePicker.requestCameraPermissionsAsync();
                                await Audio.requestPermissionsAsync();
                                if (
                                        libraryResponse.status !== "granted" ||
                                        photoResponse.status !== "granted"
                                ) {
                                        alert("Sorry, we need camera roll permissions to make this work!");
                                }
                        }
                })();
        }, []);

        const sendMessageToUser = async (user,fromUserId)=>{

                const ourSecretKey =await getMySecretKey();
                if (!ourSecretKey) {
                        return;
                      }
                
                if (!user.publicKey) {
                        Alert.alert(
                          "The user haven't set his keypair yet",
                          "Until the user generates the keypair, you cannot securely send him messages"
                        );
                        return;
                      }
                  
                     // const ourSecretKey =stringToUint8Array(ourSecretKeyString);
                 //     console.log("private key",ourSecretKey);
                        const sharedKey = box.before(  
                        stringToUint8Array(user.publicKey),
                        ourSecretKey, 
                      );
            //    console.log("shared key", sharedKey);

                const encryptedMessage = encrypt(sharedKey, { message });
                console.log("encrypted message", encryptedMessage);


                   //send a message
                 const newMessage = await DataStore.save(new Message({
                         content: encryptedMessage,
                         userID: fromUserId,
                         forUserId:user.id,
                         chatroomID: chatRoom.id,
                         replyToMessageID: messageReplyTo?.id
                 })
                );
               // updateLastMessage(newMessage);
        }
        const sendMessage = async () => {
                // get all the users of this chatroom
                const authUser = await Auth.currentAuthenticatedUser()

                const users = (await DataStore.query(ChatRoomUser))
                .filter(cru => cru.chatRoom.id === chatRoom.id ).map(cru => cru.user);

                console.log("users:" ,users);
                

                // for each user, encrypt the `content` with his public key, and save it as a new message
                    await Promise.all(users.map(user => sendMessageToUser(user, authUser.attributes.sub)));
                            
                resetFields();
        }

        const updateLastMessage = async (newMessage) => {
                DataStore.save(ChatRoom.copyOf(chatRoom, updatedChatRoom => {
                        updatedChatRoom.LastMessage = newMessage;
                }))
        }

        const onPlusClicked = () => {
                console.warn('On plus clicked');
        }
        const onPress = () => {
                if (image) {
                        sendImage();
                }
                 else if(soundURI){
                      sendAudio();
                }
                else if (message) {
                        sendMessage();
                } else {
                        onPlusClicked();
                }
        }

        const resetFields = () => {
                setMessage('');
                setIsEmojiePickerOpen(false);
                setImage(null);
                setProgress(0);
                setSoundURI(null);
                removeMessageReplyTo();
        }
        //Image Picker 
        const pickImage = async () => {
                // No permissions request is necessary for launching the image library
                const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.5,
                });
                //  console.log(result);
                if (!result.cancelled) {
                        setImage(result.uri);
                }
        };
        const takePhoto = async () => {
                const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        aspect: [4, 3],
                });

                if (!result.cancelled) {
                        setImage(result.uri);
                }
        };

        const progressCallback = (progress) => {
                setProgress(progress.loaded / progress.total);
        };

        const sendImage = async () => {
                if (!image) {
                        return;
                }
                const blob = await getBlob(image);
                const { key } = await Storage.put(`${uuidv4()}.png`, blob, {
                        progressCallback,
                });

                //send a message
                const user = await Auth.currentAuthenticatedUser()
                const newMessage = await DataStore.save(new Message({
                        content: message,
                        image: key,
                        userID: user.attributes.sub,
                        chatroomID: chatRoom.id,
                        replyToMessageID: messageReplyTo?.id
                }));

                updateLastMessage(newMessage);

                resetFields();
        };



        const getBlob = async ( uri: string) => {
                const responce = await fetch(uri);
                const blob = await responce.blob();
                return blob;
        }

        //Audio
        async function startRecording() {
                try {
                  await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                  }); 
                  console.log('Starting recording..');
                  const { recording } = await Audio.Recording.createAsync(
                     Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
                  );
                  setRecording(recording);
                  console.log('Recording started');
                } catch (err) {
                  console.error('Failed to start recording', err);
                }
              }


              async function stopRecording() {
                console.log('Stopping recording..');
                if (!recording) {
                  return;
                }
                setRecording(null);
                await recording.stopAndUnloadAsync();
                await Audio.setAudioModeAsync({
                        allowsRecordingIOS: false,
                      }); 

                const uri = recording.getURI(); 
                console.log('Recording stopped and stored at', uri);
                if(!uri){
                        return;
                }
                setSoundURI(uri);
              }
               const sendAudio = async () => {
                if (!soundURI) {
                        return;
                }
                const uriParts = soundURI.split(".");
                const extenstion = uriParts[uriParts.length - 1];
                const blob = await getBlob(soundURI);
                const { key } = await Storage.put(`${uuidv4()}.${extenstion}`, blob, {
                        progressCallback,
                });

                //send a message
                const user = await Auth.currentAuthenticatedUser()
                const newMessage = await DataStore.save(new Message({
                        content: message,
                        audio: key,
                        userID: user.attributes.sub,
                        chatroomID: chatRoom.id,
                        status:"SENT",
                        replyToMessageID: messageReplyTo?.id
                }));

                updateLastMessage(newMessage);

                resetFields();
        };
 
            
        return (
                <KeyboardAvoidingView
                        style={[styles.root, { height: isEmojiePickerOpen ? '50%' : "auto" }]}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={100}
                >

                        {messageReplyTo && (
                                <View style=
                                {{backgroundColor:'#f2f2f2', 
                                padding:5,
                                 flexDirection:'row',
                                 alignSelf: "stretch",
                                justifyContent: "space-between"}}> 
                                <View style={{flex:1}}>
                                        <Text>Reply To:</Text>
                                    <MessageComponent message={messageReplyTo}/>
                                </View>
                                <Pressable onPress={() => removeMessageReplyTo(null)}>
                                <AntDesign 
                                  name='close'
                                 size={24}
                                  color="black" 
                                  style={{ margin: 5 }} />
                                        </Pressable>
                                </View>
                        )}
                        {image && (
                                <View style={styles.sendImageContainer}>
                                <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                                        <View
                                              style={{
                                                        flex: 1,
                                                        justifyContent: "flex-start",
                                                        alignSelf: "flex-end",
                                                      }}
                                                    >
                                         <View
                                                style={{
                                                        height: 5,
                                                        borderRadius: 5,
                                                         backgroundColor: "#3777f0",
                                                         width:`${progress * 100}%`,
                                                        }}
                                               />
                                        </View>

                                      
                                        <Pressable onPress={() => setImage(null)}>
                                                <AntDesign name='close' size={24} color="black" style={{ margin: 5 }} />
                                        </Pressable>

                                </View>
                        )}

                          {soundURI && <AudioPlayer  soundURI ={soundURI}/>}
                        <View style={styles.row}>
                                <View style={styles.inputContainer}>
                                        <Pressable onPress={() =>
                                                setIsEmojiePickerOpen((currentValue) => !currentValue)}>
                                                <SimpleLineIcons
                                                        name="emotsmile"
                                                        size={24}
                                                        color="#595959"
                                                        style={styles.icon} />
                                        </Pressable>
                                        <TextInput style={styles.input}
                                                value={message}
                                                onChangeText={setMessage}
                                                placeholder='Message...'
                                        />
                                        <Pressable onPress={pickImage}>
                                                <Feather
                                                        name="image"
                                                        size={24}
                                                        color="#595959"
                                                        style={styles.icon} />
                                        </Pressable>
                                        <Pressable onPress={takePhoto}>
                                                <Feather
                                                        name="camera"
                                                        size={24}
                                                        color="#595959"
                                                        style={styles.icon} />
                                        </Pressable>


                                        <Pressable onPressIn={startRecording} onPressOut={stopRecording}>
                                        <MaterialCommunityIcons
                                                name={recording ? "microphone" :"microphone-outline"}
                                                size={24}
                                                color={recording ? "red" : "#595959"}
                                                style={styles.icon} />
                                                </Pressable>
                                </View>
                                <Pressable onPress={onPress} style={styles.buttonContainer}>
                                        {message || image || soundURI ? <Ionicons name="send" size={20} color="white" /> :
                                                <AntDesign name="plus" size={24} color="white" />}
                                </Pressable>
                        </View>
                        {isEmojiePickerOpen &&
                                (<EmojiSelector onEmojiSelected={emoji =>
                                        setMessage(currentMessage => currentMessage + emoji)}
                                        columns={8} />
                                )}
                </KeyboardAvoidingView>
        );
};


const styles = StyleSheet.create({
        root: {
                padding: 5,
        },
        row: {
                flexDirection: 'row',
        },
        inputContainer: {
                backgroundColor: '#f2f2f2',
                flex: 1,
                marginRight: 5,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: '#dedede',
                alignItems: 'center',
                flexDirection: 'row',
                padding: 8
        },
        input: {
                flex: 1,
                marginHorizontal: 5
        },
        icon: {
                marginHorizontal: 5
        },
        buttonContainer: {
                width: 45,
                height: 45,
                backgroundColor: '#3777f0',
                borderRadius: 25,
                justifyContent: 'center',
                alignItems: 'center',
        },
        buttonText: {
                color: 'white',
                fontSize: 35
        },
        sendImageContainer: {
                flexDirection: 'row',
                marginVertical: 10,
                alignSelf: 'stretch',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: 'lightgray',
                borderRadius: 10
        }
});


export default MessageInput