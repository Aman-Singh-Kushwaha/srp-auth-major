import { ChakraProvider } from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { Layout } from './components/layout/Layout';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './components/protected/Dashboard';
import { useAuth } from './hooks/useAuth';

function App() {
    const { isLoading, error, userData, register, login, logout, isAuthenticated } = useAuth();

    const content = isAuthenticated ? (
        <Layout
            title="Welcome to Your Dashboard"
            subtitle="You are securely authenticated using SRP"
        >
            <Dashboard
                userData={userData}
                onLogout={logout}
            />
        </Layout>
    ) : (
        <Layout subtitle="Experience secure password-based authentication">
            <Tabs isFitted variant="enclosed" width="100%">
                <TabList mb="1em">
                    <Tab>Login</Tab>
                    <Tab>Register</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <AuthForm
                            onSubmit={login}
                            buttonText="Login"
                            isLoading={isLoading}
                            error={error}
                        />
                    </TabPanel>
                    <TabPanel>
                        <AuthForm
                            onSubmit={register}
                            buttonText="Register"
                            isLoading={isLoading}
                            error={error}
                        />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Layout>
    );

    return (
        <ChakraProvider>
            {content}
        </ChakraProvider>
    );
}

export default App;
