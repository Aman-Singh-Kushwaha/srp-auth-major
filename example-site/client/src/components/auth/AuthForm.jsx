import { useState } from 'react';
import {
    VStack,
    Input,
    Button,
    FormControl,
    FormLabel,
    FormErrorMessage,
    useToast
} from '@chakra-ui/react';

export function AuthForm({ onSubmit, buttonText, isLoading }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const toast = useToast();

    const validateForm = () => {
        const newErrors = {};
        if (!username) newErrors.username = 'Username is required';
        if (!password) newErrors.password = 'Password is required';
        if (password && password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const success = await onSubmit(username, password);
            if (success) {
                setUsername('');
                setPassword('');
                toast({
                    title: `${buttonText} successful`,
                    status: 'success',
                    duration: 3000,
                });
            }
        } catch (error) {
            toast({
                title: `${buttonText} failed`,
                description: error.message,
                status: 'error',
                duration: 3000,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!errors.username}>
                    <FormLabel>Username</FormLabel>
                    <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                    />
                    <FormErrorMessage>{errors.username}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                    <FormLabel>Password</FormLabel>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                    />
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>

                <Button
                    type="submit"
                    colorScheme={buttonText === 'Login' ? 'blue' : 'green'}
                    isLoading={isLoading}
                    width="100%"
                >
                    {buttonText}
                </Button>
            </VStack>
        </form>
    );
} 