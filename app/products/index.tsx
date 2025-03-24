import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import {
  PlusCircle,
  Search,
  SlidersHorizontal,
  Package,
  Tag,
  Clock,
  AlertCircle,
  Trash,
  Plus,
  Eye,
  Filter,
  EyeOff,
} from "lucide-react-native";

import Header from "../../components/Header";
import BottomNavigation from "../../components/navigation/BottomNavigation";
import { getProducts, deleteProduct, markProductUnavailable, Product } from "../../services/productService";
import Notification from "../../components/Notification";
import ConfirmDialog from "../../components/ConfirmDialog";

// Define the product item type for the UI
interface ProductItem {
  id: string;
  name: string;
  category: string;
  status: 'Available' | 'Rented' | 'Sold' | 'Maintenance' | 'Unavailable';
  rentalPrice: number;
  sellingPrice: number;
  image: string;
}

const STATUS_COLORS = {
  Available: 'bg-green-100 text-green-800',
  Rented: 'bg-blue-100 text-blue-800',
  Maintenance: 'bg-yellow-100 text-yellow-800',
  Sold: 'bg-purple-100 text-purple-800',
  Unavailable: 'bg-gray-100 text-gray-800'
};

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [showUnavailable]);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts(showUnavailable);
      const formattedProducts = data.map(product => {
        const imageUrl = product.image_url || 'https://via.placeholder.com/150';
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          status: product.status,
          rentalPrice: product.rental_price,
          sellingPrice: product.selling_price,
          image: imageUrl,
        };
      });
      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePress = (product: ProductItem) => {
    setProductToDelete(product);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setIsDeleting(true);
      const success = await markProductUnavailable(productToDelete.id);
      
      if (success) {
        setDeleteDialogVisible(false);
        setSuccessMessage(`${productToDelete.name} has been marked as unavailable`);
        setShowSuccess(true);
        // Remove the product from state to update UI immediately
        setProducts(products.filter(p => p.id !== productToDelete.id));
      } else {
        throw new Error("Failed to mark product as unavailable");
      }
    } catch (err) {
      console.error("Error marking product as unavailable:", err);
      setError("Failed to mark product as unavailable");
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const renderProductItem = ({ item }: { item: ProductItem }) => {
    const statusColor = STATUS_COLORS[item.status];

    return (
      <TouchableOpacity
        className="bg-white p-4 rounded-lg mb-3 shadow-sm border border-gray-100"
        onPress={() => router.push(`/products/view?id=${item.id}`)}
      >
        <View className="flex-row justify-between">
          <Image
            source={{ uri: item.image }}
            className="w-20 h-20 rounded-lg mr-3"
          />
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">
                  {item.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Package size={14} color="#6B7280" />
                  <Text className="text-gray-500 text-sm ml-1">
                    {item.category}
                  </Text>
                </View>
              </View>
              <View className={`px-2 py-1 rounded-full ${statusColor}`}>
                <Text className="text-xs font-medium">{item.status}</Text>
              </View>
            </View>
            <View className="flex-row mt-3 pt-3 border-t border-gray-100 justify-between">
              <View className="flex-row items-center">
                <View className="flex-row items-center mr-4">
                  <Tag size={14} color="#6B7280" />
                  <Text className="text-gray-700 text-sm ml-1">
                    ₹{item.rentalPrice}/day
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Clock size={14} color="#6B7280" />
                  <Text className="text-gray-700 text-sm ml-1">
                    ₹{item.sellingPrice} selling price
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Header title="Products" />
      
      <View className="flex-row justify-between items-center px-4 pt-2 pb-4">
        {showSearch ? (
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 mr-2"
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        ) : (
          <View className="flex-row space-x-2 items-center">
            <TouchableOpacity
              className="bg-white p-2 rounded-lg shadow-sm border border-gray-100"
              onPress={() => setShowSearch(true)}
            >
              <Search size={20} color="#4B5563" />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100"
              onPress={() => setShowUnavailable(!showUnavailable)}
            >
              <Eye size={18} color={showUnavailable ? "#3B82F6" : "#4B5563"} />
              <Text className={`ml-1 ${showUnavailable ? "text-blue-500" : "text-gray-600"}`}>
                {showUnavailable ? "Show All" : "Hide Unavailable"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity
          className="bg-blue-500 p-2 rounded-lg ml-2"
          onPress={() => router.push('/products/add')}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4 pt-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="mt-4 text-gray-600">Loading products...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center">
            <AlertCircle size={48} color="#EF4444" />
            <Text className="mt-4 text-red-500">{error}</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Package size={48} color="#9CA3AF" />
            <Text className="mt-4 text-gray-500">No products found</Text>
            <Text className="mt-2 text-gray-400 text-center px-10">
              Start by adding some products to your inventory
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          />
        )}
      </View>

      <View className="absolute bottom-0 left-0 right-0">
        <BottomNavigation activeTab="products" />
      </View>

      {/* Success notification */}
      <Notification
        visible={showSuccess}
        type="success"
        message={successMessage}
        onDismiss={() => setShowSuccess(false)}
        autoClose={3000}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Mark as Unavailable"
        message="Are you sure you want to mark this product as unavailable? This will hide it from available products but preserve order history."
        confirmText="Mark Unavailable"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogVisible(false)}
        isProcessing={isDeleting}
        type="warning"
      />
    </SafeAreaView>
  );
}
