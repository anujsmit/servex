import { Stack } from 'expo-router';

export default function ServiceRequestLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                presentation: 'card',
                animation: 'none',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="available"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="[mistriId]"
                options={{
                    headerShown: false,
                }}
            />
        </Stack>
    );
}

