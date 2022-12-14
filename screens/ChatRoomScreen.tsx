
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet,FlatList,SafeAreaView, ActivityIndicator } from 'react-native';
import Message from '../components/Message';
import { useRoute,useNavigation } from "@react-navigation/core";
import { DataStore } from '@aws-amplify/datastore';
import { Message as MessageModel } from '../src/models';
import MessageInput from '../components/MessageInput';
import { ChatRoom } from '../src/models';
import { Auth, SortDirection } from 'aws-amplify';
export default function ChatRoomScreen() {
        const [messages, setMessages] = useState<MessageModel[]>([]);
        const [messageReplyTo, setMessageReplyTo] = useState<MessageModel | null>(null);
        const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);


        const route = useRoute();
        const navigation = useNavigation();
       

        useEffect(()=>{
           fetchChatRoom();
        },[]);

        useEffect(()=>{
                fetchMessages();
        },[chatRoom]);

        useEffect(()=>{
           const subscription = DataStore.observe(MessageModel).subscribe(msg =>{
                    //  console.log(msg.model, msg.opType, msg.element);
                      if(msg.model === MessageModel && msg.opType === 'INSERT'){
                              setMessages(existingMessage => [ msg.element,...existingMessage])
                      } 
           }); 

           return()=> subscription.unsubscribe();
        },[]);

        const fetchChatRoom =async () => {
                if(!route.params?.id){
                        console.warn('No chatRoom Id Provided');
                        return;
                }
                const chatRoom = await DataStore.query(ChatRoom, route.params.id);

                if (!chatRoom) {
                        console.error("Couldn't find a chat room with this id");
                      } else {
                        setChatRoom(chatRoom);
                      }
        };

        const fetchMessages =async () => {
                if(!chatRoom){
                        return;
                }
                const authUser = await Auth.currentAuthenticatedUser();
                const myId = authUser.attributes.sub;
                  const fetchedMessages = await DataStore.query(MessageModel, 
                        message => message.chatroomID("eq", chatRoom?.id).forUserId("eq", myId ), 
                        {
                          sort: message => message.createdAt(SortDirection.DESCENDING)
                        }
                        );
                       // console.log(fetchedMessages);
                        setMessages(fetchedMessages);
                };

//        // console.warn('Display chat room:', route.params?.id)
//        useEffect(() =>{
//         navigation.setOptions({title:'Elon Mask'})
//        },[])

       
       if(!chatRoom){
               return <ActivityIndicator />
       }

       //  console.log(messageReplyTo?.content);
        return (
                <SafeAreaView style={styles.page}>
               <FlatList
                         data={messages} 
                         renderItem={({item}) => <Message message={item} 
                         setAsMessageReply={() => setMessageReplyTo(item)}
                         />}
                         inverted
                         />
                    <MessageInput chatRoom={chatRoom} 
                     messageReplyTo={messageReplyTo}
                     removeMessageReplyTo={() => setMessageReplyTo(null)}
                    />
              </SafeAreaView>
        );
};

// define your styles
const styles = StyleSheet.create({
        page:{
                backgroundColor:'white',
                flex:1
        },

});


