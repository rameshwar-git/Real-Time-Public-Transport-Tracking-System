import React from "react";
import { StyleSheet,Text, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";

interface ButtonComponentProps {
    title: string;
    isDisabled?: boolean;
    onPress: () => void;
}

const ButtonComponent: React.FC<ButtonComponentProps> = ({
    title,
    isDisabled = false,
    onPress
}) => {
    return (
        <TouchableOpacity
            disabled={isDisabled }
            style={[styles.buttonContainer, isDisabled && styles.isbuttondisabled ]}   
            onPress={onPress} >
            <Text style={styles.textStyle} >{title}</Text>
        </TouchableOpacity>
    );
}
const styles = StyleSheet.create({
    buttonContainer: {
        height: 40,
        width: '80%',
        margin: 2,
        padding: 5,
        alignSelf: 'center',
        alignContent: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.9,
        shadowRadius: 3.84,
        shadowOffset: {
            width: 1,
            height: 1
        }

    },
    isbuttondisabled: {
        backgroundColor: 'grey',
        opacity: 0.8
    },
    textStyle: {
        marginHorizontal: 15,
        padding: 3,
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        textShadowColor: 'black',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 2
    },
});

export default ButtonComponent;