const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanOneThousand(num: number): string {
  let current = '';

  if (num >= 100) {
    current += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  if (num >= 20) {
    current += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }

  if (num > 0) {
    current += ones[num] + ' ';
  }

  return current.trim();
}

/**
 * Converts a positive number into English words with currency suffix.
 * e.g., 25400 -> "Twenty Five Thousand Four Hundred Rupees Only"
 */
export function numberToWords(amount: number, currencyName: string = 'Rupees'): string {
  if (isNaN(amount) || amount === 0) {
    return `Zero ${currencyName} Only`;
  }

  const rounded = Math.abs(Math.round(amount * 100) / 100);
  const integerPart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return `Zero ${currencyName} Only`;
  }

  let words = '';

  // Billions
  const billions = Math.floor(integerPart / 1000000000);
  let remainder = integerPart % 1000000000;

  // Millions
  const millions = Math.floor(remainder / 1000000);
  remainder %= 1000000;

  // Thousands
  const thousands = Math.floor(remainder / 1000);
  remainder %= 1000;

  if (billions > 0) {
    words += convertLessThanOneThousand(billions) + ' Billion ';
  }

  if (millions > 0) {
    words += convertLessThanOneThousand(millions) + ' Million ';
  }

  if (thousands > 0) {
    words += convertLessThanOneThousand(thousands) + ' Thousand ';
  }

  if (remainder > 0) {
    words += convertLessThanOneThousand(remainder) + ' ';
  }

  words = words.trim();

  if (decimalPart > 0) {
    const decimalWords = convertLessThanOneThousand(decimalPart);
    return `${words} ${currencyName} and ${decimalWords} Cents/Paisa Only`.replace(/\s+/g, ' ').trim();
  }

  return `${words} ${currencyName} Only`.replace(/\s+/g, ' ').trim();
}
