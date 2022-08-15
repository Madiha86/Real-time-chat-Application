//import liraries
import { FontAwesome } from '@expo/vector-icons';
import React, { Component } from 'react';
import { Pressable, Text, StyleSheet ,View} from 'react-native';

// create a component
const NewGroupButton = ({onPress}) => {
        return (
                <Pressable onPress={onPress}>
                        <View style={{flexDirection:'row' , padding:10, alignItems:'center'}}>
                                <FontAwesome name='group' size={24} color="#4f4f4f" />
                        <Text style={{marginLeft:10, fontWeight:'bold'}}>new group</Text>
                        </View>
                </Pressable>
        );
};


const styles = StyleSheet.create({
      
});

export default NewGroupButton;
