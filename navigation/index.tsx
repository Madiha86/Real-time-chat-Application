/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
 import { Feather, FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
 import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
 import { NavigationContainer, DefaultTheme, DarkTheme, useNavigation } from '@react-navigation/native';
 import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
 import * as React from 'react';
 import { ColorSchemeName, Pressable, useWindowDimensions, View, Text, Image } from 'react-native';
 
 import Colors from '../constants/Colors';
 import useColorScheme from '../hooks/useColorScheme';
 import ModalScreen from '../screens/ModalScreen';
 import NotFoundScreen from '../screens/NotFoundScreen';
 import HomeScreen from '../screens/HomeScreen';
 import UsersScreen from '../screens/UsersScreen';
 import TabTwoScreen from '../screens/TabTwoScreen';
 //import { RootStackParams, RootTabParamList, RootTabScreenProps } from '../types';
 import LinkingConfiguration from './LinkingConfiguration';
 import ChatRoomScreen from '../screens/ChatRoomScreen';
import { Auth } from 'aws-amplify';
import ChatRoomHeader from './ChatRoomHeader';
import GroupInfoScreen from '../screens/GroupInfoScreen';
import SettingScreen from '../screens/Setting';
 
 export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
   return (
     <NavigationContainer
       linking={LinkingConfiguration}
       theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
       <RootNavigator />
     </NavigationContainer>
   );
 }
 
 /**
  * A root stack navigator is often used for displaying modals on top of all other content.
  * https://reactnavigation.org/docs/modal
  */

  export type RootStackParams = {
    Home;
    ChatRoom;
    NotFound;
   UsersScreen;
   GroupInfoScreen;
   Settings;
  }

 const RootStack = createNativeStackNavigator<RootStackParams>();
 
 function RootNavigator() {
   return (
     <RootStack.Navigator>
       <RootStack.Screen name="Home" component={HomeScreen}
         options={{
           headerTitle: HomeHeader
         }} />
       <RootStack.Screen name="ChatRoom" component={ChatRoomScreen}
         options={({route})=>({
           headerTitle: ( ) => <ChatRoomHeader  id={route.params?.id}/>,
           headerBackVisible: false
         })} />
         <RootStack.Screen name="GroupInfoScreen" component={GroupInfoScreen}/>
       <RootStack.Screen name="UsersScreen"
         component={UsersScreen}
         options={{
           title: "Users"
         }}
       />
       <RootStack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
       <RootStack.Screen name="Settings" component={SettingScreen}/>

       {/* <Stack.Group screenOptions={{ presentation: 'modal' }}>
         <Stack.Screen name="Modal" component={ModalScreen} />
       </Stack.Group> */}
     </RootStack.Navigator>
   );
 }
 const HomeHeader = (props) => {
 
   const { width } = useWindowDimensions();
   const navigation = useNavigation<NativeStackNavigationProp<RootStackParams>>();

   return (
     <View style={{
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       width
     }}>
       <Image
         source={{ uri: 'https://images.pexels.com/photos/159767/baby-cute-moe-brilliant-159767.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500' }}
         style={{ width: 30, height: 30, borderRadius: 30 }}
       />
       <Text style={{ flex: 1, textAlign: 'center', marginLeft: 40, fontWeight: 'bold' }}>Chattify</Text>
       <Pressable onPress={() => navigation.navigate("Settings")}>
        <Feather
          name="settings"
          size={24}
          color="black"
          style={{ marginHorizontal: 10 }}
        />
      </Pressable>
        <Pressable onPress={() => navigation.navigate('UsersScreen')}>
       <Feather name="edit-2" size={24} color="black" style={{ marginHorizontal: 20 }} />
        </Pressable> 
     </View>
   )
 }
 

 
 function TabBarIcon(props: {
   name: React.ComponentProps<typeof FontAwesome>['name'];
   color: string;
 }) {
   return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
 }
 