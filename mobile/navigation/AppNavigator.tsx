import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AgentsScreen from '../screens/AgentsScreen';
import TrainingScreen from '../screens/TrainingScreen';
import MemoryScreen from '../screens/MemoryScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Dashboard') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Agents') {
              iconName = focused ? 'git-network' : 'git-network-outline';
            } else if (route.name === 'Training') {
              iconName = focused ? 'school' : 'school-outline';
            } else if (route.name === 'Memory') {
              iconName = focused ? 'brain' : 'brain-outline';
            } else {
              iconName = 'ellipse';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Manus AI' }}
        />
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ title: 'Tasks' }}
        />
        <Tab.Screen 
          name="Agents" 
          component={AgentsScreen}
          options={{ title: 'Mirror Agents' }}
        />
        <Tab.Screen 
          name="Training" 
          component={TrainingScreen}
          options={{ title: 'Training' }}
        />
        <Tab.Screen 
          name="Memory" 
          component={MemoryScreen}
          options={{ title: 'Memory' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
