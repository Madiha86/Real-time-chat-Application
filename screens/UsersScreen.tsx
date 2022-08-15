import React,{useState,useEffect} from 'react';
import { StyleSheet,View,FlatList, Pressable,Text, Alert } from 'react-native';
import UserItem from '../components/UserItem';
import NewGroupButton from '../components/NewGroupButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../navigation';
import { Auth, DataStore } from 'aws-amplify';
import { ChatRoom, User,ChatRoomUser } from '../src/models';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UsersScreen(){
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isNewGroup, setIsNewGroup] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();

//query users
  useEffect(() => {
    DataStore.query(User).then(setUsers);
  }, []);

  // useEffect(()=>{
  //   
  //   const fetchUsers = async()=>{
  //     const fetchedUsers = await DataStore.query(User);
  //     setUsers(fetchedUsers);
  //   };
  //   fetchUsers();
  // },[])


  const addUserToChatRoom =  async(user, chatroom)=>{
    DataStore.save
    (new ChatRoomUser({
      user,
      chatRoom: chatroom
    })
    )
  }

  const createChatRoom = async(users) => {
     //connect authenticated user with the chat room
     const authUser = await Auth.currentAuthenticatedUser();
     const dbUser = await DataStore.query(User, authUser.attributes.sub); 
     if (!dbUser) {
      Alert.alert("There was an error creating the group");
      return;
    }

    //create a chatroom
    const newChatRoomData = {
      newMessages:0,
      Admin:dbUser
    };

    if(users.length > 1){
      newChatRoomData.name="new Group";
      newChatRoomData.imageUri=    
      "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/group.jpeg";
    }
    const newChatRoom = await DataStore.save(new ChatRoom(newChatRoomData));

   
    if(dbUser){
      await addUserToChatRoom(dbUser, newChatRoom);
  }

    //connect users user with the chat room
   await Promise.all(
     users.map((user) => 
     addUserToChatRoom(user,  newChatRoom))
   );

    navigation.navigate('ChatRoom', { id: newChatRoom.id});

}
 const isUserSelected = (user) => {
      return selectedUsers.some((selectedUser)=> selectedUser.id === user.id);
 }


const onUserPress= async(user)=>{
  if (isNewGroup){
    if(isUserSelected(user)){
              // remove it from selected
              setSelectedUsers(
                selectedUsers.filter((selectedUser) => selectedUser.id !== user.id)
              );
    }else{
      setSelectedUsers([...selectedUsers, user])
    }
  }else{
    await createChatRoom([user]);
  }
}
const saveGroup = async () => {
  await createChatRoom(selectedUsers);
};
  return(
    <SafeAreaView style={styles.page}>
       <FlatList
        data={users}
        renderItem={({ item }) => (
        <UserItem user={item} onPress={() => onUserPress(item)}
        isSelected={isNewGroup ? isUserSelected(item) : undefined}/>
  )}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => <NewGroupButton onPress={() => setIsNewGroup(!isNewGroup)} />}
        />
      {isNewGroup && ( 
      <Pressable style={styles.button} onPress={saveGroup}>
          <Text style={styles.buttonText}>
            Save Group({selectedUsers.length})
            </Text>
        </Pressable>
      )}
      </SafeAreaView>
  )
}
 
const styles = StyleSheet.create({
 page:{
   backgroundColor:'white',
   flex:1
 },
button:{
  backgroundColor: "#3777f0",
  marginHorizontal: 10,
  padding: 10,
  marginBottom:10,
  alignItems: "center",
  borderRadius: 10,
},
buttonText:{
  color: "white",
  fontWeight: "bold",
},
})