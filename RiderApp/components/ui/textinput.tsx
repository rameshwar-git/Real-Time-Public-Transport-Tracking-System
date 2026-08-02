import React, { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface TextInputComponentProps {
    value?: string;
    placeholderText?: string;
    inputAccessoryViewID?: string;
    secureTextEntry?: boolean;
    onChangeText?: (value: string) => void;
}

const TextInputComponent : React.FC<TextInputComponentProps> = ({
    placeholderText,
    inputAccessoryViewID,
    secureTextEntry = false,
    onChangeText,
    value
}) => {
    
    return (
        <View>
            <TextInput
                style={styles.input}
                placeholder={ placeholderText || ""}
                onChangeText={onChangeText}
                value={value}
                inputAccessoryViewID={inputAccessoryViewID}
                secureTextEntry={secureTextEntry}
            />
        </View>
    );
}
const styles = StyleSheet.create({
    input: {
        width: "90%",
        height: 40,
        color: 'grey',
        alignSelf: 'center',
        borderColor: 'gray',
        borderWidth: 1,
        margin: 5,
        marginHorizontal: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
});

export default TextInputComponent;