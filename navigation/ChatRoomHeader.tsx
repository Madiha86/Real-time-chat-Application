import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Auth, DataStore } from "aws-amplify";
import moment from "moment";
import React, { useEffect,useState } from "react";
import { Pressable, useWindowDimensions, Image,View,Text } from "react-native";
import { ChatRoom, ChatRoomUser, User } from "../src/models";
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from ".";



//Chatroom Header
const ChatRoomHeader = ({id,children}) => {
        const [user,setUser] = useState<User|null>(null);
        const [allUsers, setAllUsers] = useState<User[]>([]);
        const [chatRoom, setChatRoom] = useState<ChatRoom | undefined>(undefined);
        const { width } = useWindowDimensions();

        const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();


        const logOut = async () => {
        // await DataStore.clear();
          Auth.signOut();
        }


        const fetchUsers = async()=>{
          const fetchedUsers = (await DataStore.query(ChatRoomUser))
          .filter(ChatRoomUser => ChatRoomUser.chatRoom.id === id)
          .map(ChatRoomUser => ChatRoomUser.user);
         
         // console.log(fetchedUsers);
          setAllUsers(fetchedUsers);
 
          const authUser = await Auth.currentAuthenticatedUser();
   setUser(fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null);
      };
    
        const fetchChatRoom =async () => {
          if(!id){
            return;
    }
          DataStore.query(ChatRoom, id).then(setChatRoom);
          
        }

        useEffect(()=>{
                fetchUsers();
                fetchChatRoom();
               },[]);
           
           const getLastOnlineText = ()=>{
             if(!user?.lastOnlineAt){
               return null;
             }
                 // if lastOnlineAt is less than 5 minutes ago, show him as ONLINE
                 const lastOnlineDiffMS = moment().diff(moment(user.lastOnlineAt));
                 if(lastOnlineDiffMS < 5 * 60 *  1000){
                   // less than 5 minutes
                     return "online";
           }else{
            return `Last seen online ${moment(user.lastOnlineAt).fromNow()}`;
           }
          };

          const getUsernames = () => {
            return allUsers.map((user) => user.name).join(", ");
          };

          const openInfo = () => {
            // redirect to info page
            navigation.navigate("GroupInfoScreen", { id });
          };
                
          const isGroup = allUsers.length > 2;

        return (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: width - 15,
            marginLeft: 15,
          }}>
      
            <Image source=
            {{uri: chatRoom?.imageUri || user?.imageUri,}}
              style={{ width: 30, height: 30, borderRadius: 30 }}
            />

            <Pressable onPress={openInfo} style={{flex:1, marginLeft: 10,}}>
            <Text style={{fontWeight: 'bold' }}>
              {chatRoom?.name || user?.name}
              </Text>
              <Text numberOfLines={1}>
                {isGroup ? getUsernames() : getLastOnlineText()}
                </Text>
            </Pressable>

            <MaterialIcons
             name="video-call"
              size={24} 
              color="black" 
              style={{ marginHorizontal: 15 }} />

            <Ionicons
             name="md-call" 
             size={24} 
             color="black"
              style={{ marginHorizontal: 2 }} />

            <Pressable onPress={logOut}>
              <MaterialIcons
               name="logout"
                size={24} 
                color="black" 
                style={{ marginHorizontal: 23 }} />
            </Pressable>
      
          </View>
        );
      };

      export default ChatRoomHeader;