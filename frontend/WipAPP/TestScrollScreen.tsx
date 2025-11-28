import React from 'react';
import { 
  View, 
  FlatList, 
  Text, 
  StyleSheet,
  ListRenderItem 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the type for list items
type ListItem = {
  id: string;
  text: string;
};

export default function TestScrollScreen() {
  // Create the data for the list
  const data: ListItem[] = Array.from({ length: 100 }, (_, i) => ({
    id: i.toString(),
    text: `🎯 Item número ${i + 1}`
  }));

  // Function to render each item
  const renderItem: ListRenderItem<ListItem> = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>{item.text}</Text>
    </View>
  );

  // Component for the header
  const ListHeaderComponent = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>MI APLICACIÓN</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={ListHeaderComponent}
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        />
      </View>
    </SafeAreaView>
  );
}

// Your styles remain the same
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
});