import React from "react";
import { View, Text } from "react-native";

interface PieChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  size?: number;
}

export default function PieChart({ data, size = 180 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Simple representation of a pie chart using colored squares for now
  // In a real app, you would use a proper charting library or SVG
  return (
    <View className="items-center">
      <View
        className="flex-row flex-wrap justify-center"
        style={{ width: size }}
      >
        {data.map((item, index) => {
          const percentage = Math.round((item.value / total) * 100);

          return (
            <View key={index} className="m-1 items-center">
              <View
                style={{
                  width: size / 4,
                  height: size / 4,
                  backgroundColor: item.color,
                  borderRadius: 4,
                }}
              />
              <Text className="text-xs text-gray-700 mt-1">{item.label}</Text>
              <Text className="text-xs font-medium">{percentage}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
