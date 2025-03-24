import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Save,
  Plus,
  Minus,
  Package,
  Calendar,
  User,
  DollarSign,
  Search,
  X,
  ShoppingBag,
  Tag,
  Trash,
} from "lucide-react-native";
import { getAvailableProducts, getProductsForSale, getProductById } from "../../services/productService";
import { createOrder, Order, OrderItem } from "../../services/orderService";
import { getAllCustomers, createCustomer, Customer } from "../../services/customerService";
import DatePickerModal from "../../components/DatePickerModal";
import CustomerSelector from "../../components/CustomerSelector";
import Notification from "../../components/Notification";

interface ProductItem {
  id: string;
  name: string;
  pricePerDay?: number; // For rentals
  sellingPrice?: number; // For sales
  quantity: number;
  selected?: boolean;
  productType: 'rental' | 'sale' | 'both';
  imageUrl?: string;
  // Fields for rental periods
  startDate?: string;
  endDate?: string;
  customRentalPeriod?: boolean;
  rentalDays?: number; // Calculated days between start and end date
}

export default function AddOrderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ productId?: string, type?: 'rental' | 'sale' }>();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerId: "",
    startDate: "",
    endDate: "",
    notes: "",
    transactionType: params.type as 'rental' | 'sale' || 'rental',
    discount_amount: "0", // Keep only discount amount
    paymentStatus: "Unpaid" as "Paid" | "Unpaid" // Payment status
  });

  // Notification state
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "info" | "warning"
  });

  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Customer selector state
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // tomorrow

  // State for handling shared vs custom rental periods
  const [useSharedDates, setUseSharedDates] = useState(true);

  // Use the params.type value as the initial state
  const [orderType, setOrderType] = useState<"rental" | "sale">(params.type as "rental" | "sale" || "rental");
  const [includeSoldProducts, setIncludeSoldProducts] = useState(false);

  // Load available products and preselect product if productId is provided
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      
      try {
        let products = [];
        
        if (orderType === "rental") {
          // Get products available for rental
          const rentalProducts = await getAvailableProducts();
          products = rentalProducts.map(p => ({
            id: p.id,
            name: p.name,
            pricePerDay: p.rental_price,
            sellingPrice: p.selling_price,
            quantity: 1,
            productType: 'rental' as 'rental' | 'sale' | 'both',
            imageUrl: p.image_url
          }));
        } else {
          // Get products available for sale
          const saleProducts = await getProductsForSale(includeSoldProducts);
          products = saleProducts.map(p => ({
            id: p.id,
            name: p.name,
            pricePerDay: p.rental_price,
            sellingPrice: p.selling_price,
            quantity: 1,
            productType: 'sale' as 'rental' | 'sale' | 'both',
            imageUrl: p.image_url
          }));
        }
        
        setAvailableProducts(products);
        
        // If a product ID is provided, preselect it
        if (params.productId) {
          const product = await getProductById(params.productId);
          if (product) {
            const productItem = {
              id: product.id,
              name: product.name,
              pricePerDay: product.rental_price,
              sellingPrice: product.selling_price,
              quantity: 1,
              productType: orderType
            };
            
            setSelectedProducts([productItem]);
          }
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [params.productId, orderType, includeSoldProducts]);

  // Calculate days between two dates
  const calculateDays = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Update all selected products with the shared dates
  useEffect(() => {
    if (useSharedDates && selectedProducts.length > 0) {
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      const days = calculateDays(startDate, endDate);
      
      const updatedProducts = selectedProducts.map(product => ({
        ...product,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        rentalDays: days
      }));
      
      setSelectedProducts(updatedProducts);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        startDate: formattedStartDate,
        endDate: formattedEndDate
      }));
    }
  }, [startDate, endDate, useSharedDates]);

  // Show notification
  const showNotification = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setNotification({
      visible: true,
      message,
      type
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Handle product selection
  const toggleProductSelection = (product: ProductItem) => {
    const isSelected = selectedProducts.some(p => p.id === product.id);
    
    if (isSelected) {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      const days = calculateDays(startDate, endDate);
      
      const newProduct = {
        ...product,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        rentalDays: days
      };
      
      setSelectedProducts(prev => [...prev, newProduct]);
    }
  };

  // Handle quantity change
  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setSelectedProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, quantity: newQuantity } 
          : product
      )
    );
  };

  // Handle item date change
  const updateProductDates = (productId: string, newStartDate?: string, newEndDate?: string) => {
    setSelectedProducts(prev => 
      prev.map(product => {
        if (product.id === productId) {
          const start = newStartDate || product.startDate;
          const end = newEndDate || product.endDate;
          
          // Calculate rental days if both dates are available
          let rentalDays = product.rentalDays;
          if (start && end) {
            const startObj = new Date(start);
            const endObj = new Date(end);
            rentalDays = calculateDays(startObj, endObj);
          }
          
          return { 
            ...product, 
            startDate: start, 
            endDate: end,
            rentalDays
          };
        }
        return product;
      })
    );
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    
    selectedProducts.forEach(product => {
      const price = orderType === 'rental' 
        ? (product.pricePerDay || 0) * (product.rentalDays || 1) * product.quantity
        : (product.sellingPrice || 0) * product.quantity;
      
      subtotal += price;
    });
    
    let discountValue = 0;
    
    if (formData.discount_amount) {
      const amount = parseFloat(formData.discount_amount);
      if (!isNaN(amount)) {
        discountValue = amount;
      }
    }
    
    const total = Math.max(0, subtotal - discountValue);
    
    return {
      subtotal,
      discountValue,
      total
    };
  };

  // Submit order
  const handleSubmit = async () => {
    // Check if all required fields are filled
    if (!formData.customerName) {
      showNotification("Please select a customer", "error");
      return;
    }
    
    if (selectedProducts.length === 0) {
      showNotification("Please select at least one product", "error");
      return;
    }
    
    if (orderType === 'rental' && (!formData.startDate || !formData.endDate)) {
      showNotification("Please select start and end dates for rental", "error");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { subtotal, discountValue, total } = calculateTotals();
      
      // Format order items
      const orderItems = selectedProducts.map(product => ({
        product_id: product.id,
        product_name: product.name,
        quantity: product.quantity,
        unit_price: orderType === 'rental' 
          ? (product.pricePerDay || 0) 
          : (product.sellingPrice || 0)
      }));
      
      // Store whether this is a paid order
      const isPaid = formData.paymentStatus === 'Paid';
      
      // Set payment status to 'Unpaid' initially to prevent any transaction creation issue
      // We'll update it after successful order creation
      const orderData = {
        customer_id: formData.customerId || undefined,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail || undefined,
        customer_phone: formData.customerPhone || undefined,
        order_type: orderType as 'rental' | 'sale',
        status: 'Active' as 'Active' | 'Completed' | 'Returned' | 'Overdue' | 'Cancelled',
        payment_status: 'Unpaid' as 'Paid' | 'Unpaid' | 'Partial' | 'Cancelled',
        start_date: orderType === 'rental' ? formData.startDate : undefined,
        end_date: orderType === 'rental' ? formData.endDate : undefined,
        items: JSON.stringify(orderItems),
        total_amount: total,
        subtotal: subtotal,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        discount_value: discountValue,
        notes: formData.notes || undefined
      };
      
      // Call API to create order
      const result = await createOrder(orderData);
      
      if (result) {
        // If the order was supposed to be paid, update its payment status and create transaction
        if (isPaid && result.id) {
          try {
            const { createOrderTransaction } = await import('../../services/transactionService');
            await createOrderTransaction(
              result.id,
              result.total_amount,
              result.order_type,
              'cash' // Default payment method
            );
            
            // Update order payment status
            const { updateOrder } = await import('../../services/orderService');
            await updateOrder(result.id, { payment_status: 'Paid' });
            
            console.log(`Order ${result.id} marked as paid and transaction created`);
          } catch (transactionError) {
            console.error("Error creating transaction:", transactionError);
            // Show warning but don't fail the entire process
            showNotification("Order created, but payment recording failed. Please mark as paid manually.", "warning");
          }
        }
        
        showNotification("Order created successfully!", "success");
        
        // Navigate to order details page
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        showNotification("Failed to create order", "error");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      showNotification("Error creating order. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email || "",
      customerPhone: customer.phone || ""
    }));
    
    setShowCustomerSelector(false);
  };

  const { subtotal, discountValue, total } = calculateTotals();

  // Fetch available products based on the order type
  const fetchAvailableProducts = useCallback(async () => {
    setLoading(true);
    
    try {
      if (orderType === "rental") {
        const products = await getAvailableProducts();
        setAvailableProducts(products.map(p => ({
          id: p.id,
          name: p.name,
          pricePerDay: p.rental_price,
          sellingPrice: p.selling_price,
          quantity: 1,
          productType: 'rental' as 'rental' | 'sale' | 'both',
          imageUrl: p.image_url
        })));
      } else {
        // For sales, get products with an option to include sold items
        const products = await getProductsForSale(includeSoldProducts);
        setAvailableProducts(products.map(p => ({
          id: p.id,
          name: p.name,
          pricePerDay: p.rental_price,
          sellingPrice: p.selling_price,
          quantity: 1,
          productType: 'sale' as 'rental' | 'sale' | 'both',
          imageUrl: p.image_url
        })));
      }
    } catch (error) {
      console.error("Error fetching available products:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [orderType, includeSoldProducts]);

  useEffect(() => {
    fetchAvailableProducts();
  }, [fetchAvailableProducts]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View 
          style={{ paddingTop: insets.top }}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2"
            >
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold">
              {orderType === 'rental' ? 'New Rental' : 'New Sale'}
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`p-2 rounded-md ${isSubmitting ? 'bg-gray-300' : 'bg-blue-500'}`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Save size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0000ff" />
              <Text className="mt-2">Loading...</Text>
            </View>
          ) : (
            <ScrollView className="flex-1 px-4 py-2">
              {/* Customer Info */}
              <View className="mb-4 bg-white rounded-md p-4">
                <Text className="text-lg font-semibold mb-2">Customer Information</Text>
                
                <TouchableOpacity
                  onPress={() => setShowCustomerSelector(true)}
                  className="flex-row items-center justify-between p-3 bg-gray-100 rounded-md mb-2"
                >
                  <View className="flex-row items-center">
                    <User size={20} color="#666" />
                    <Text className="ml-2 text-gray-600">
                      {formData.customerName || "Select Customer"}
                    </Text>
                  </View>
                  <ArrowLeft size={20} color="#666" style={{ transform: [{ rotate: '180deg' }] }} />
                </TouchableOpacity>
                
                {formData.customerName && (
                  <View>
                    {formData.customerEmail && (
                      <Text className="text-gray-600 ml-2 mb-1">
                        Email: {formData.customerEmail}
                      </Text>
                    )}
                    {formData.customerPhone && (
                      <Text className="text-gray-600 ml-2">
                        Phone: {formData.customerPhone}
                      </Text>
                    )}
                  </View>
                )}
              </View>
              
              {/* Products */}
              <View className="mb-4 bg-white rounded-md p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-lg font-semibold">Products</Text>
                  <TouchableOpacity
                    onPress={() => setShowProductSelector(true)}
                    className="flex-row items-center bg-blue-500 px-3 py-1 rounded-md"
                  >
                    <Plus size={16} color="#fff" />
                    <Text className="text-white ml-1">Add</Text>
                  </TouchableOpacity>
                </View>
                
                {selectedProducts.length === 0 ? (
                  <View className="items-center justify-center py-8 bg-gray-50 rounded-md">
                    <Package size={40} color="#999" />
                    <Text className="text-gray-500 mt-2">No products selected</Text>
                    <TouchableOpacity
                      onPress={() => setShowProductSelector(true)}
                      className="mt-2 bg-blue-500 px-4 py-2 rounded-md"
                    >
                      <Text className="text-white">Add Products</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    {orderType === 'rental' && (
                      <View className="mb-4 bg-gray-50 p-3 rounded-md">
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className="font-medium">Rental Period</Text>
                          <Switch
                            value={useSharedDates}
                            onValueChange={setUseSharedDates}
                            trackColor={{ false: "#767577", true: "#81b0ff" }}
                            thumbColor={useSharedDates ? "#1E40AF" : "#f4f3f4"}
                          />
                        </View>
                        
                        {useSharedDates ? (
                          <View className="flex-row justify-between">
                            <TouchableOpacity
                              onPress={() => setShowStartDatePicker(true)}
                              className="flex-1 flex-row items-center p-2 mr-2 bg-white rounded-md border border-gray-300"
                            >
                              <Calendar size={16} color="#666" />
                              <Text className="ml-2">
                                {startDate.toISOString().split('T')[0]}
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              onPress={() => setShowEndDatePicker(true)}
                              className="flex-1 flex-row items-center p-2 bg-white rounded-md border border-gray-300"
                            >
                              <Calendar size={16} color="#666" />
                              <Text className="ml-2">
                                {endDate.toISOString().split('T')[0]}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <Text className="text-sm text-gray-500">Each product has its own rental period</Text>
                        )}
                      </View>
                    )}
                    
                    {selectedProducts.map((product, index) => (
                      <View 
                        key={product.id} 
                        className="mb-3 p-3 bg-gray-50 rounded-md"
                      >
                        <View className="flex-row">
                          {product.imageUrl && (
                            <Image
                              source={{ uri: product.imageUrl }}
                              className="w-16 h-16 rounded-md mr-3"
                              resizeMode="cover"
                            />
                          )}
                          
                          <View className="flex-1">
                            <View className="flex-row justify-between">
                              <Text className="font-medium">{product.name}</Text>
                              <TouchableOpacity
                                onPress={() => toggleProductSelection(product)}
                              >
                                <X size={18} color="#666" />
                              </TouchableOpacity>
                            </View>
                            
                            <Text className="text-gray-600">
                              {orderType === 'rental' 
                                ? `$${product.pricePerDay}/day` 
                                : `$${product.sellingPrice}`
                              }
                            </Text>
                            
                            {/* Quantity selector */}
                            <View className="flex-row items-center mt-2">
                              <TouchableOpacity
                                onPress={() => updateProductQuantity(product.id, product.quantity - 1)}
                                className="w-8 h-8 items-center justify-center bg-gray-200 rounded-l-md"
                              >
                                <Minus size={16} color="#333" />
                              </TouchableOpacity>
                              
                              <View className="w-10 h-8 items-center justify-center bg-white border-t border-b border-gray-300">
                                <Text>{product.quantity}</Text>
                              </View>
                              
                              <TouchableOpacity
                                onPress={() => updateProductQuantity(product.id, product.quantity + 1)}
                                className="w-8 h-8 items-center justify-center bg-gray-200 rounded-r-md"
                              >
                                <Plus size={16} color="#333" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                        
                        {/* Per-product rental period (if not using shared dates) */}
                        {orderType === 'rental' && !useSharedDates && (
                          <View className="mt-2 pt-2 border-t border-gray-200">
                            <Text className="text-sm font-medium mb-1">Rental Period</Text>
                            <View className="flex-row justify-between">
                              <TouchableOpacity
                                className="flex-1 flex-row items-center p-2 mr-2 bg-white rounded-md border border-gray-300"
                              >
                                <Calendar size={16} color="#666" />
                                <Text className="ml-2">
                                  {product.startDate || "Start Date"}
                                </Text>
                              </TouchableOpacity>
                              
                              <TouchableOpacity
                                className="flex-1 flex-row items-center p-2 bg-white rounded-md border border-gray-300"
                              >
                                <Calendar size={16} color="#666" />
                                <Text className="ml-2">
                                  {product.endDate || "End Date"}
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <Text className="text-right text-sm text-gray-500 mt-1">
                              {product.rentalDays} days
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              {/* Order Details */}
              <View className="mb-4 bg-white rounded-md p-4">
                <Text className="text-lg font-semibold mb-2">Order Details</Text>
                
                {/* Payment Status */}
                <View className="mb-3">
                  <Text className="text-gray-600 mb-1">Payment Status</Text>
                  <View className="flex-row">
                    <TouchableOpacity
                      onPress={() => setFormData(prev => ({ ...prev, paymentStatus: "Paid" }))}
                      className={`flex-1 py-2 items-center rounded-l-md ${
                        formData.paymentStatus === "Paid" 
                          ? "bg-green-500" 
                          : "bg-gray-200"
                      }`}
                    >
                      <Text 
                        className={formData.paymentStatus === "Paid" ? "text-white" : "text-gray-600"}
                      >
                        Paid
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => setFormData(prev => ({ ...prev, paymentStatus: "Unpaid" }))}
                      className={`flex-1 py-2 items-center rounded-r-md ${
                        formData.paymentStatus === "Unpaid" 
                          ? "bg-orange-500" 
                          : "bg-gray-200"
                      }`}
                    >
                      <Text 
                        className={formData.paymentStatus === "Unpaid" ? "text-white" : "text-gray-600"}
                      >
                        Unpaid
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Discount */}
                <View className="mb-3">
                  <Text className="text-gray-600 mb-1">Discount</Text>
                  <View className="flex-row items-center">
                    <Text className="mr-2 text-lg">$</Text>
                    <TextInput
                      value={formData.discount_amount}
                      onChangeText={(text) => {
                        // Only allow numbers and decimals
                        if (/^(\d*\.?\d*)$/.test(text) || text === "") {
                          setFormData(prev => ({ ...prev, discount_amount: text }))
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      className="flex-1 p-2 bg-gray-100 rounded-md"
                    />
                  </View>
                </View>
                
                {/* Notes */}
                <View className="mb-3">
                  <Text className="text-gray-600 mb-1">Notes</Text>
                  <TextInput
                    value={formData.notes}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                    placeholder="Add notes about this order..."
                    multiline
                    numberOfLines={3}
                    className="p-2 bg-gray-100 rounded-md"
                    textAlignVertical="top"
                  />
                </View>
              </View>
              
              {/* Order Summary */}
              <View className="mb-4 bg-white rounded-md p-4">
                <Text className="text-lg font-semibold mb-2">Order Summary</Text>
                
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-600">Subtotal:</Text>
                  <Text className="text-gray-800">${subtotal.toFixed(2)}</Text>
                </View>
                
                {discountValue > 0 && (
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600">Discount:</Text>
                    <Text className="text-red-500">-${discountValue.toFixed(2)}</Text>
                  </View>
                )}
                
                <View className="flex-row justify-between pt-2 mt-2 border-t border-gray-200">
                  <Text className="font-semibold">Total:</Text>
                  <Text className="font-semibold text-lg">${total.toFixed(2)}</Text>
                </View>
              </View>
              
              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`p-3 rounded-md items-center mb-6 ${
                  isSubmitting ? "bg-gray-400" : "bg-blue-500"
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-lg">
                    {orderType === 'rental' ? 'Complete Rental' : 'Complete Sale'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
          
          {/* Product Selector Modal */}
          {showProductSelector && (
            <View className="absolute inset-0 bg-black bg-opacity-50">
              <View className="flex-1 m-4 mt-20 bg-white rounded-md">
                <View className="p-4 flex-row justify-between items-center border-b border-gray-200">
                  <Text className="text-lg font-semibold">Select Products</Text>
                  <TouchableOpacity onPress={() => setShowProductSelector(false)}>
                    <X size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                
                <View className="p-4 bg-gray-50">
                  <View className="flex-row items-center bg-white rounded-md px-2 border border-gray-300">
                    <Search size={20} color="#666" />
                    <TextInput
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                      placeholder="Search products..."
                      className="flex-1 p-2"
                    />
                    {searchTerm ? (
                      <TouchableOpacity onPress={() => setSearchTerm("")}>
                        <X size={18} color="#666" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                
                <FlatList
                  data={availableProducts.filter(p => 
                    p.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => {
                    const isSelected = selectedProducts.some(p => p.id === item.id);
                    return (
                      <TouchableOpacity
                        onPress={() => toggleProductSelection(item)}
                        className={`p-3 border-b border-gray-100 flex-row items-center ${
                          isSelected ? "bg-blue-50" : ""
                        }`}
                      >
                        {item.imageUrl && (
                          <Image
                            source={{ uri: item.imageUrl }}
                            className="w-12 h-12 rounded-md mr-3"
                            resizeMode="cover"
                          />
                        )}
                        
                        <View className="flex-1">
                          <Text className="font-medium">{item.name}</Text>
                          <Text className="text-gray-600">
                            {orderType === 'rental' 
                              ? `$${item.pricePerDay}/day` 
                              : `$${item.sellingPrice}`
                            }
                          </Text>
                        </View>
                        
                        <View className="w-6 h-6 border rounded-md items-center justify-center border-blue-500">
                          {isSelected && (
                            <View className="w-4 h-4 bg-blue-500 rounded-sm" />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View className="items-center justify-center py-8">
                      <Package size={40} color="#999" />
                      <Text className="text-gray-500 mt-2">No products found</Text>
                    </View>
                  }
                />
                
                <View className="p-4 border-t border-gray-200">
                  <TouchableOpacity
                    onPress={() => setShowProductSelector(false)}
                    className="p-3 bg-blue-500 rounded-md items-center"
                  >
                    <Text className="text-white font-semibold">Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          
          {/* Customer Selector Modal */}
          {showCustomerSelector && (
            <CustomerSelector
              visible={showCustomerSelector}
              onClose={() => setShowCustomerSelector(false)}
              onSelectCustomer={handleCustomerSelect}
              onCreateNewCustomer={(customerData) => {
                // Handle new customer creation
                console.log('Create new customer:', customerData);
                createCustomer({
                  name: customerData.name,
                  email: customerData.email || "",
                  phone: customerData.phone || "",
                  address: "",
                  notes: ""
                }).then(newCustomer => {
                  if (newCustomer) {
                    handleCustomerSelect(newCustomer);
                  }
                }).catch(error => {
                  console.error("Error creating customer:", error);
                  showNotification("Error creating customer", "error");
                });
              }}
            />
          )}
          
          {/* Date Pickers */}
          <DatePickerModal
            visible={showStartDatePicker}
            onClose={() => setShowStartDatePicker(false)}
            onSelectDate={(date) => {
              setStartDate(date);
              setShowStartDatePicker(false);
              
              // If end date is before start date, update end date
              if (endDate < date) {
                const newEndDate = new Date(date);
                newEndDate.setDate(date.getDate() + 1);
                setEndDate(newEndDate);
              }
              
              // Update form data with formatted date
              const formattedDate = date.toISOString().split('T')[0];
              setFormData(prev => ({
                ...prev,
                startDate: formattedDate
              }));
            }}
            initialDate={startDate}
            title="Select Start Date"
          />
          
          <DatePickerModal
            visible={showEndDatePicker}
            onClose={() => setShowEndDatePicker(false)}
            onSelectDate={(date) => {
              setEndDate(date);
              setShowEndDatePicker(false);
              
              // Update form data with formatted date
              const formattedDate = date.toISOString().split('T')[0];
              setFormData(prev => ({
                ...prev,
                endDate: formattedDate
              }));
            }}
            initialDate={endDate}
            title="Select End Date"
          />
          
          {/* Notification */}
          {notification.visible && (
            <Notification
              visible={notification.visible}
              message={notification.message}
              type={notification.type}
              onDismiss={() => setNotification(prev => ({ ...prev, visible: false }))}
              autoClose={3000}
              showDismissButton={true}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 