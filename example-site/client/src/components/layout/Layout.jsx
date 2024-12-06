import {
    Container,
    VStack,
    Heading,
    Text,
    Link,
    Box
} from '@chakra-ui/react';

export function Layout({ children, title, subtitle }) {
    return (
        <Box minH="100vh" bg="gray.50" py={10}>
            <Container maxW="container.sm">
                <VStack spacing={8}>
                    <VStack spacing={2} textAlign="center">
                        <Heading color="blue.600">
                            {title || 'SRP Authentication Demo'}
                        </Heading>
                        {subtitle && (
                            <Text color="gray.600">
                                {subtitle}
                            </Text>
                        )}
                    </VStack>

                    {children}

                    <Text fontSize="sm" color="gray.500" mt={8}>
                        Secure Remote Password Protocol Implementation
                        {' • '}
                        <Link
                            color="blue.500"
                            href="https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol"
                            isExternal
                        >
                            Learn More
                        </Link>
                    </Text>
                </VStack>
            </Container>
        </Box>
    );
} 