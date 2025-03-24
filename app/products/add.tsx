import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Save, Camera, Plus, X, ImageIcon, Calendar, ChevronLeft, ChevronRight, DollarSign } from "lucide-react-native";
import * as ExpoImagePicker from 'expo-image-picker';
import { createProduct, getProductById, updateProduct } from "../../services/productService";
import { processImagesForStorage } from "../../utils/imageUtils";

import Header from "../../components/Header";
import Notification from "../../components/Notification";
import DatePickerModal from "../../components/DatePickerModal";

// Generate array of month names
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Generate array of years (5 years back, 5 years forward)
const YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

// Define a proper type for our image object
interface ImageData {
  uri: string;
  base64?: string;
}

interface ProductItem {
  id: string;
  name: string;
  pricePerDay?: number; // For rentals
  sellingPrice?: number; // For sales
  quantity: number;
  selected?: boolean;
  productType: 'rental' | 'sale' | 'both';
  imageUrl?: string;
  // New fields for per-item rental periods
  startDate?: string;
  endDate?: string;
  customRentalPeriod?: boolean;
  rentalDays?: number; // Calculated days between start and end date
}

export default function ProductAddScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    productType: "both", // Default: both rental and sale
    rentalPrice: "",
    sellingPrice: "",
    purchaseDate: "",
    purchasePrice: "",
  });

  // Multiple images state (up to 3) with correct typing
  const [images, setImages] = useState<ImageData[]>([]);

  // Specifications list
  const [specifications, setSpecifications] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState("");
  
  // Custom date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Load product data if ID is provided (editing mode)
  useEffect(() => {
    const fetchProductForEditing = async () => {
      if (!id) return;
      
      try {
        const productData = await getProductById(id);
        if (!productData) {
          setNotificationMessage("Product not found");
          setShowErrorNotification(true);
          return;
        }
        
        // Set editing flag
        setIsEditing(true);
        
        // Populate form data
        setFormData({
          name: productData.name || "",
          category: productData.category || "",
          description: productData.description || "",
          productType: productData.product_type || "both",
          rentalPrice: productData.rental_price?.toString() || "",
          sellingPrice: productData.selling_price?.toString() || "",
          purchaseDate: productData.purchase_date || "",
          purchasePrice: productData.purchase_price?.toString() || "",
        });
        
        // Populate specifications
        if (productData.specifications) {
          try {
            const specs = JSON.parse(productData.specifications);
            if (Array.isArray(specs)) {
              setSpecifications(specs);
            }
          } catch (error) {
            console.error("Error parsing specifications:", error);
          }
        }
        
        // Populate images
        if (productData.images) {
          try {
            const parsedImages = JSON.parse(productData.images);
            if (Array.isArray(parsedImages)) {
              // Convert base64 strings to image objects
              const imageObjects = parsedImages.map((img: any) => ({
                uri: `data:image/jpeg;base64,${img.base64}`,
                base64: img.base64
              }));
              setImages(imageObjects);
            }
          } catch (error) {
            console.error("Error parsing images:", error);
          }
        }
        
        // Set purchase date if available
        if (productData.purchase_date) {
          const purchaseDate = new Date(productData.purchase_date);
          if (!isNaN(purchaseDate.getTime())) {
            setSelectedDate(purchaseDate);
          }
        }
        
      } catch (error) {
        console.error("Error fetching product for editing:", error);
        setNotificationMessage("Failed to load product for editing");
        setShowErrorNotification(true);
      }
    };
    
    fetchProductForEditing();
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSpecification = () => {
    if (newSpec.trim()) {
      setSpecifications([...specifications, newSpec.trim()]);
      setNewSpec("");
    }
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const handleImagePicker = async () => {
    if (images.length >= 3) {
      setNotificationMessage("You can upload a maximum of 3 images per product.");
      setShowErrorNotification(true);
      return;
    }

    // Request permission
    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      setNotificationMessage("Sorry, we need camera roll permissions to make this work!");
      setShowErrorNotification(true);
      return;
    }

    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Reduced quality for smaller file size
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        if (selectedImage.uri) {
          // Explicitly type the new image with our interface
          const newImage: ImageData = {
            uri: selectedImage.uri,
            base64: selectedImage.base64 || undefined
          };
          setImages([...images, newImage]);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setNotificationMessage("Failed to pick image. Please try again.");
      setShowErrorNotification(true);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Handle selecting a date
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Format date as YYYY-MM-DD for storage
    const formattedDate = formatDate(date);
    handleChange("purchaseDate", formattedDate);
  };
  
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "Select date";
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Select date";
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || !formData.category) {
      setNotificationMessage("Please fill in all required fields");
      setShowErrorNotification(true);
      return;
    }

    // Validate prices based on product type
    if (formData.productType === "rental" || formData.productType === "both") {
      if (!formData.rentalPrice) {
        setNotificationMessage("Please enter a rental price");
        setShowErrorNotification(true);
        return;
      }
    }
    
    if (formData.productType === "sale" || formData.productType === "both") {
      if (!formData.sellingPrice) {
        setNotificationMessage("Please enter a selling price");
        setShowErrorNotification(true);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      // Process images for storage
      const processedImages = await processImagesForStorage(images);
      
      const productData = {
        name: formData.name,
        category: formData.category,
        description: formData.description,
        product_type: formData.productType as 'rental' | 'sale' | 'both',
        rental_price: parseFloat(formData.rentalPrice) || 0,
        selling_price: parseFloat(formData.sellingPrice) || 0,
        status: "Available" as "Available" | "Rented" | "Sold" | "Maintenance",
        purchase_date: formData.purchaseDate,
        purchase_price: parseFloat(formData.purchasePrice) || 0,
        specifications: JSON.stringify(specifications),
        images: JSON.stringify(processedImages)
      };

      let result;
      if (isEditing) {
        result = await updateProduct(id as string, productData);
        if (result) {
          setNotificationMessage("Product updated successfully");
        } else {
          throw new Error("Failed to update product");
        }
      } else {
        result = await createProduct(productData);
        if (result) {
          setNotificationMessage("Product created successfully");
        } else {
          throw new Error("Failed to create product");
        }
      }

      setShowSuccessNotification(true);
      
      // Reset form after successful save
      if (!isEditing) {
        setFormData({
          name: "",
          category: "",
          description: "",
          productType: "both",
          rentalPrice: "",
          sellingPrice: "",
          purchaseDate: "",
          purchasePrice: "",
        });
        setImages([]);
        setSpecifications([]);
      }
      
      // Go back after a short delay to show the success notification
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (error) {
      console.error("Error saving product:", error);
      setNotificationMessage(`Failed to ${isEditing ? 'update' : 'create'} product: ${error instanceof Error ? error.message : String(error)}`);
      setShowErrorNotification(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the custom Tailwind date picker
  const renderDatePickerButton = () => (
    <View className="mb-4">
      <Text className="text-gray-700 mb-1">Purchase Date</Text>
      <TouchableOpacity
        className="flex-row items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
        onPress={() => setShowDatePicker(true)}
      >
        <Calendar size={20} color="#6B7280" />
        <Text className="ml-2 text-gray-800">
          {formatDisplayDate(formData.purchaseDate)}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Header
        title={id ? "Edit Product" : "Add Product"}
        leftIcon={<ArrowLeft size={24} color="#000" />}
        onLeftPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }}
        >
          {/* Product Images */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Product Images (Max 3)
            </Text>
            
            <View className="flex-row flex-wrap">
              {images.map((image, index) => (
                <View key={index} className="w-1/3 p-1 relative">
                <Image
                    source={{ uri: image.uri }}
                    className="w-full h-24 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-white p-1 rounded-full"
                    onPress={() => removeImage(index)}
                  >
                    <X size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {images.length < 3 && (
                <TouchableOpacity
                  className="w-1/3 p-1"
                  onPress={handleImagePicker}
                >
                  <View className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center bg-gray-50">
                    <Camera size={24} color="#6B7280" />
                    <Text className="text-gray-500 mt-1 text-xs">Add Image</Text>
                  </View>
                </TouchableOpacity>
              )}
              </View>
            
            {images.length === 0 && (
              <View className="mt-3 items-center justify-center p-5 bg-gray-50 rounded-lg border border-gray-200">
                <ImageIcon size={40} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2 text-center">No images selected. Please add at least one product image.</Text>
              <TouchableOpacity
                  className="mt-3 bg-blue-500 px-4 py-2 rounded-lg"
                onPress={handleImagePicker}
              >
                  <Text className="text-white font-medium">Select Images</Text>
              </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Basic Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Basic Information
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Product Name *
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.name}
                onChangeText={(value) => handleChange("name", value)}
                placeholder="Enter product name"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Category *</Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.category}
                onChangeText={(value) => handleChange("category", value)}
                placeholder="Enter product category"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">Product Type *</Text>
              <View className="flex-row">
                {(["rental", "sale", "both"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    className={`mr-2 px-4 py-2 rounded-lg ${formData.productType === type ? "bg-blue-500" : "bg-gray-200"}`}
                    onPress={() => handleChange("productType", type)}
                  >
                    <Text
                      className={`${formData.productType === type ? "text-white" : "text-gray-800"}`}
                    >
                      {type === "rental" ? "For Rent" : type === "sale" ? "For Sale" : "Both"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {(formData.productType === "rental" || formData.productType === "both") && (
              <View className="mb-4">
                <Text className="text-gray-700 mb-2 font-medium">
                  Rental Price ($/day) *
                </Text>
                <TextInput
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  value={formData.rentalPrice}
                  onChangeText={(value) => handleChange("rentalPrice", value)}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            )}

            {(formData.productType === "sale" || formData.productType === "both") && (
              <View className="mb-4">
                <Text className="text-gray-700 mb-2 font-medium">
                  Selling Price ($) *
                </Text>
                <TextInput
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  value={formData.sellingPrice}
                  onChangeText={(value) => handleChange("sellingPrice", value)}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Description
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[100px]"
                value={formData.description}
                onChangeText={(value) => handleChange("description", value)}
                placeholder="Enter product description"
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Specifications */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Specifications
            </Text>

            <View className="flex-row mb-4">
              <TextInput
                className="flex-1 bg-gray-50 p-3 rounded-l-lg border border-gray-200"
                value={newSpec}
                onChangeText={setNewSpec}
                placeholder="Add a specification"
              />
              <TouchableOpacity
                className="bg-blue-500 px-4 rounded-r-lg items-center justify-center"
                onPress={addSpecification}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {specifications.map((spec, index) => (
              <View
                key={index}
                className="flex-row justify-between items-center bg-gray-50 p-3 rounded-lg mb-2"
              >
                <Text className="flex-1 text-gray-700">{spec}</Text>
                <TouchableOpacity onPress={() => removeSpecification(index)}>
                  <X size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Purchase Information */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-5">
            <Text className="text-lg font-bold mb-3 text-gray-900">
              Purchase Information
            </Text>

            {renderDatePickerButton()}
            
            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Purchase Date
              </Text>
              <TouchableOpacity
                className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex-row items-center justify-between"
                onPress={() => setShowDatePicker(true)}
              >
                <Text className="text-gray-700">
                  {formData.purchaseDate || "Select date (MM/DD/YYYY)"}
                </Text>
                <Calendar size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 mb-2 font-medium">
                Purchase Price ($)
              </Text>
              <TextInput
                className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                value={formData.purchasePrice}
                onChangeText={(value) => handleChange("purchasePrice", value)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            className={`${isSubmitting ? "bg-blue-300" : "bg-blue-500"} py-3 rounded-lg flex-row items-center justify-center mb-10`}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
            <Save size={20} color="#FFFFFF" />
            )}
            <Text className="text-white font-medium ml-2">
              {isSubmitting ? "Saving..." : id ? "Update Product" : "Add Product"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Tailwind DatePicker */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={handleDateSelect}
        initialDate={selectedDate}
        title="Select Purchase Date"
      />

      {/* Success notification */}
      <Notification
        visible={showSuccessNotification}
        type="success"
        message={notificationMessage}
        onDismiss={() => setShowSuccessNotification(false)}
        autoClose={3000}
      />

      {/* Error notification */}
      <Notification
        visible={showErrorNotification}
        type="error"
        message={notificationMessage}
        onDismiss={() => setShowErrorNotification(false)}
        autoClose={4000}
      />
    </SafeAreaView>
  );
}
