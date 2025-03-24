import React from "react";
import { View, Text } from "react-native";

interface BarChartProps {
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  height?: number;
  showValues?: boolean;
}

export default function BarChart({
  data,
  height = 200,
  showValues = true,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <View className="w-full">
      <View className="flex-row justify-between h-8 mb-1">
        {data.map((item, index) => (
          <Text
            key={index}
            className="text-xs text-gray-500 text-center"
            style={{ width: `${100 / data.length}%` }}
          >
            {item.label}
          </Text>
        ))}
      </View>

      <View className="flex-row items-end h-full" style={{ height }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * height;

          return (
            <View key={index} className="flex-1 items-center">
              {showValues && (
                <Text className="text-xs mb-1 font-medium">
                  ${item.value.toLocaleString()}
                </Text>
              )}
              <View
                style={{
                  height: barHeight,
                  backgroundColor: item.color,
                  width: "70%",
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
