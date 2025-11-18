import { InventoryItem } from '../types';

const STORAGE_KEY = 'home_ledger_items_v3'; // Bumped version for new schema

export const getItems = (): InventoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load items", e);
    return [];
  }
};

export const saveItem = (item: InventoryItem): InventoryItem[] => {
  const items = getItems();
  // Check if updating existing
  const existingIndex = items.findIndex(i => i.id === item.id);
  let newItems;
  
  if (existingIndex >= 0) {
    newItems = [...items];
    newItems[existingIndex] = item;
  } else {
    newItems = [item, ...items];
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  return newItems;
};

export const deleteItem = (id: string): InventoryItem[] => {
  const items = getItems();
  const newItems = items.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  return newItems;
};

export const exportToCSV = (items: InventoryItem[]) => {
  const headers = [
    'Name', 'Category', 'Room', 'Conveyance', 
    'Purchase Price', 'Current Value', 'Serial #', 'Model #', 
    'Purchase Date', 'Warranty Expires', 'Maintenance Notes', 'Description', 'Date Added'
  ];
  
  const csvContent = [
    headers.join(','),
    ...items.map(item => {
      return [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        `"${item.room}"`,
        `"${item.conveyance}"`, 
        item.purchasePrice,
        item.currentValue,
        `"${item.serialNumber || ''}"`, 
        `"${item.modelNumber || ''}"`, 
        item.purchaseDate || '',
        item.warrantyExpiration || '',
        `"${(item.maintenanceNotes || '').replace(/"/g, '""')}"`,
        `"${item.description.replace(/"/g, '""')}"`,
        item.dateAdded
      ].join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `MyHomey_Asset_Report_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Seed some data if empty for demo purposes
export const seedDataIfEmpty = () => {
  const items = getItems();
  if (items.length === 0) {
    const seed: InventoryItem[] = [
      {
        id: '1',
        name: 'Samsung Smart Refrigerator',
        category: 'Major Appliances',
        room: 'Kitchen',
        purchasePrice: 3200,
        currentValue: 2800,
        description: '4-Door French Door, Stainless Steel',
        dateAdded: new Date().toISOString(),
        purchaseDate: '2023-01-15',
        conveyance: 'Fixture',
        serialNumber: 'B123-X998-KLM',
        modelNumber: 'RF28R7351SR',
        warrantyExpiration: '2026-01-15',
        maintenanceNotes: 'Change water filter every 6 months (Model HAF-QIN)',
        imageUrl: 'https://picsum.photos/200/200?random=10'
      },
      {
        id: '2',
        name: 'MacBook Pro 16"',
        category: 'Electronics',
        room: 'Office',
        purchasePrice: 2800,
        currentValue: 2400,
        description: '2023 model, Space Gray, M2 Max',
        dateAdded: new Date().toISOString(),
        purchaseDate: '2023-05-15',
        conveyance: 'Personal',
        imageUrl: 'https://picsum.photos/200/200?random=1'
      },
      {
        id: '3',
        name: 'Leather Sofa',
        category: 'Furniture',
        room: 'Living Room',
        purchasePrice: 1800,
        currentValue: 1200,
        description: 'Vintage brown leather 3-seater',
        dateAdded: new Date().toISOString(),
        purchaseDate: '2020-01-10',
        conveyance: 'Personal',
        imageUrl: 'https://picsum.photos/200/200?random=2'
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  }
};
