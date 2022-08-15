import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, {useEffect, useState }from 'react';
import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';
import Amplify, { Auth, DataStore, Hub } from 'aws-amplify';
import config from './src/aws-exports';
import { withAuthenticator,AmplifyTheme } from "aws-amplify-react-native";
import { Message, User } from './src/models';
import { box } from "tweetnacl";
import {encrypt, decrypt, generateKeyPair } from './utils/crypto';


import { LogBox } from 'react-native';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
LogBox.ignoreLogs(['Setting a timer for a long period of time'])

Amplify.configure(config);



const obj = { hello: 'world' };
const pairA = generateKeyPair();
const pairB = generateKeyPair();

const sharedA = box.before(pairB.publicKey, pairA.secretKey);

const encrypted = encrypt(sharedA, obj);

const sharedB = box.before(pairA.publicKey, pairB.secretKey);

const decrypted = decrypt(sharedB, encrypted);
console.log(obj, encrypted, decrypted);

function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  const [user, setUser] = useState<User | null>(null);

  useEffect(()=>{
const listener = Hub.listen('datastore', async hubData => {
  const  { event, data } = hubData.payload;
  if(event === 'outboxMutationProcessed' 
  && data.model === Message 
  &&  !(["DELIVERED", "READ"].includes (data.element.status))){
      //set the message status to delivered
      DataStore.save(
        Message.copyOf(data.element, (updated) => {
          updated.status = "DELIVERED";
        })
      )

    }
  })

// Remove listener
return ()=> listener();

  },[]);

  useEffect(()=>{
    if (!user) {
      return;
    }
    const subscription = DataStore.observe(User, user.id).subscribe((msg) =>{
             //  console.log(msg.model, msg.opType, msg.element);
               if(msg.model === User && msg.opType === 'UPDATE'){
                       setUser(msg.element);
               } 
    }); 

    return()=> subscription.unsubscribe();
 },[user?.id]);
  
  useEffect(()=>{
      fetchUser();
  },[])

  useEffect(() =>{
    const interval = setInterval(async () => {
      await updateLastOnline();
    }, 1 * 60 * 1000);
    return () => clearInterval(interval);
  },[user])

  const fetchUser =async () => {
     const  userData = await Auth.currentAuthenticatedUser();
     const user = await DataStore.query(User,  userData.attributes.sub);
     if (user) {
      setUser(user);
    }
  };
  const updateLastOnline = async () => {
    
    if (!user) {
      return;
    }
     const response = await DataStore.save(
      User.copyOf(user, (updated) => {
        updated.lastOnlineAt = +(new Date());
      })
    );
    setUser(response);
  };
  //Auth.currentAuthenticatedUser().then(console.log);
    if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <ActionSheetProvider>
        <Navigation colorScheme={colorScheme} />
        </ActionSheetProvider>
        <StatusBar />
      </SafeAreaProvider>
    );
  }
}

const customTheme = {
  ...AmplifyTheme,
  button:{
    ...AmplifyTheme.button,
    backgroundColor: '#3777f0',
  },
  sectionFooterLink: {
		fontSize: 14,
		color: '#3777f0',
		alignItems: 'baseline',
		textAlign: 'center',
	},
  buttonDisabled: {
		backgroundColor: '#3777f0',
		alignItems: 'center',
		padding: 16,
	},

}

export default  withAuthenticator(App,{theme :customTheme});