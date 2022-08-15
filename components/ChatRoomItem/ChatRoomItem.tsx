import React,{useState,useEffect} from 'react';
import { Text, Image, View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import styles from './styles';
import { DataStore } from '@aws-amplify/datastore';
import { ChatRoomUser,Message,User } from '../../src/models';
import { useNavigation } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation';
import { Auth } from 'aws-amplify';
import moment from "moment";



export default function ChatRoomItem({ chatRoom }) {
    // const [users, setUsers] = useState<User[]>([]); // all users in this chatroom
     const [user, setUser] = useState<User | null>(null); // the display user
     const [lastMessage, setLastMessage] = useState<Message|undefined>(); 
     const [isLoading, setIsLoading] = useState(true);



  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();

// console.log(chatRoom);
    useEffect(()=>{
     const fetchUsers = async()=>{
         const fetchedUsers = (await DataStore.query(ChatRoomUser))
         .filter(ChatRoomUser => ChatRoomUser.chatRoom.id === chatRoom.id)
         .map(ChatRoomUser => ChatRoomUser.user);
        
        // console.log(fetchedUsers);
        // setUsers(fetchedUsers);

         const authUser = await Auth.currentAuthenticatedUser();
          setUser(fetchedUsers.find(user => user.id !== authUser.attributes.sub) || null);
          setIsLoading(false);
     };

     fetchUsers();
    },[]);

       useEffect(()=>{
             if(!chatRoom.chatRoomLastMessageId) { return }
             DataStore.query(Message , chatRoom.chatRoomLastMessageId).then(setLastMessage);
       },[]);

  const onPress = () => {
 //  console.warn('pressed on ', user.name)
    navigation.navigate('ChatRoom', { id: chatRoom.id});
  }
 
  if(isLoading){
    return <ActivityIndicator  />
  }

  const time = moment(lastMessage?.createdAt).from(moment());

  return (
      <Pressable onPress={onPress} style={styles.container}>
      <Image source={{ uri:chatRoom.imageUri || user?.imageUri}} style={styles.image} />

      {!!chatRoom.newMessages  && <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{chatRoom.newMessages}</Text>
      </View>}

      <View style={styles.rightContainer}>
        <View style={styles.row}>
          <Text style={styles.name}>{chatRoom.name || user?.name}</Text>
          <Text style={styles.text}>{time}</Text>
        </View>
        <Text numberOfLines={1} style={styles.text}>{lastMessage?.content}</Text>
      </View>
    
    </Pressable>
    
  );
}