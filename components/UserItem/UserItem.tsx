import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, Image, View, StyleSheet, Pressable } from 'react-native';
import styles from './styles';



export default function UserItem({
   user, onPress, onLongPress , isSelected,isAdmin = false,
  }) {
    // null | false | true
  return (
      <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.container}>
      <Image source={{ uri: user.imageUri}} style={styles.image} />
      <View style={styles.rightContainer}>
          <Text style={styles.name}>{user.name}</Text>
          {isAdmin && <Text>admin</Text>}
      </View>
         {isSelected !== undefined && (
            <Feather name={isSelected ? "check-circle" : "circle"} 
         size={20} color="#4f4f4f" />
        )}
    </Pressable> 
  );
}