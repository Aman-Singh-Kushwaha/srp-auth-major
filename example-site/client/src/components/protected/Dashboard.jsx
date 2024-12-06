import {
    VStack,
    Heading,
    Text,
    Button,
    Card,
    CardBody,
    Box,
    Code,
    Divider
} from '@chakra-ui/react';

export function Dashboard({ userData, onLogout }) {
    return (
        <Card>
            <CardBody>
                <VStack spacing={4} align="stretch">
                    <Heading size="lg" color="blue.600">
                        Welcome, {userData.username}!
                    </Heading>
                    
                    <Divider />
                    
                    <Box>
                        <Text fontWeight="bold" mb={2}>
                            Your Current Session Details:
                        </Text>
                        <Text fontSize="sm" mb={2}>
                            Shared Key (for demonstration purposes):
                        </Text>
                        <Code p={3} borderRadius="md" width="100%" bg="gray.50">
                            {userData.sharedKey}
                        </Code>
                    </Box>

                    <Text fontSize="sm" color="gray.600">
                        This key is securely shared between your browser and the server,
                        demonstrating successful SRP authentication.
                    </Text>

                    <Button
                        colorScheme="red"
                        onClick={onLogout}
                        mt={4}
                    >
                        Logout
                    </Button>
                </VStack>
            </CardBody>
        </Card>
    );
} 