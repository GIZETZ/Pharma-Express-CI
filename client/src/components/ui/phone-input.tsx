import React, { forwardRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  onChange?: (value: string) => void;
  value?: string;
  className?: string;
  "data-testid"?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, value = "", className, placeholder = "XX XX XX XX XX", ...props }, ref) => {
    const [localValue, setLocalValue] = useState("");

    // Initialiser avec la valeur sans le préfixe +225
    useEffect(() => {
      if (value && value.startsWith("+225")) {
        setLocalValue(value.slice(4).trim()); // Enlever "+225"
      } else if (value && !value.startsWith("+225")) {
        setLocalValue(value);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Filtrer seulement les chiffres et espaces
      const filteredValue = inputValue.replace(/[^\d\s]/g, "");
      
      setLocalValue(filteredValue);
      
      // Envoyer la valeur complète avec +225
      if (onChange) {
        const fullValue = filteredValue.trim() ? `+225 ${filteredValue}` : "";
        onChange(fullValue);
      }
    };

    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium pointer-events-none z-10">
          +225
        </div>
        <Input
          {...props}
          ref={ref}
          type="tel"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn("pl-16", className)}
          data-testid={props["data-testid"] || "input-phone"}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };