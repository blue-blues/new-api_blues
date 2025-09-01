import {Label} from 'semantic-ui-react';
import {Tag} from "@douyinfe/semi-ui";

export function renderText(text, limit) {
    if (text.length > limit) {
        return text.slice(0, limit - 3) + '...';
    }
    return text;
}

export function renderGroup(group) {
    if (group === '') {
        return <Tag size='large'>default</Tag>;
    }
    let groups = group.split(',');
    groups.sort();
    return <>
        {groups.map((group) => {
            if (group === 'vip' || group === 'pro') {
                return <Tag size='large' color='yellow'>{group}</Tag>;
            } else if (group === 'svip' || group === 'premium') {
                return <Tag size='large' color='red'>{group}</Tag>;
            }
            if (group === 'default') {
                return <Tag size='large'>{group}</Tag>;
            } else {
                return <Tag size='large' color={stringToColor(group)}>{group}</Tag>;
            }
        })}
    </>;
}

export function renderNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 10000) {
        return (num / 1000).toFixed(1) + 'k';
    } else {
        return num;
    }
}

export function renderQuotaNumberWithDigit(num, digits = 2) {
    let displayInCurrency = localStorage.getItem('display_in_currency');
    num = num.toFixed(digits);
    if (displayInCurrency) {
        return '$' + num;
    }
    return num;
}

export function renderNumberWithPoint(num) {
    num = num.toFixed(2);
    if (num >= 100000) {
        // Convert number to string to manipulate it
        let numStr = num.toString();
        // Find the position of the decimal point
        let decimalPointIndex = numStr.indexOf('.');

        let wholePart = numStr;
        let decimalPart = '';

        // If there is a decimal point, split the number into whole and decimal parts
        if (decimalPointIndex !== -1) {
            wholePart = numStr.slice(0, decimalPointIndex);
            decimalPart = numStr.slice(decimalPointIndex);
        }

        // Take the first two and last two digits of the whole number part
        let shortenedWholePart = wholePart.slice(0, 2) + '..' + wholePart.slice(-2);

        // Return the formatted number
        return shortenedWholePart + decimalPart;
    }

    // If the number is less than 100,000, return it unmodified
    return num;
}

export function getQuotaPerUnit() {
    let quotaPerUnit = localStorage.getItem('quota_per_unit');
    quotaPerUnit = parseFloat(quotaPerUnit);
    return quotaPerUnit;
}

export function getQuotaWithUnit(quota, digits = 6) {
    let quotaPerUnit = localStorage.getItem('quota_per_unit');
    quotaPerUnit = parseFloat(quotaPerUnit);
    return (quota / quotaPerUnit).toFixed(digits);
}

export function renderQuota(quota, digits = 2) {
    let quotaPerUnit = localStorage.getItem('quota_per_unit');
    let displayInCurrency = localStorage.getItem('display_in_currency');
    quotaPerUnit = parseFloat(quotaPerUnit);
    displayInCurrency = displayInCurrency === 'true';
    if (displayInCurrency) {
        return '$' + (quota / quotaPerUnit).toFixed(digits);
    }
    return renderNumber(quota);
}

export function renderQuotaWithPrompt(quota, digits) {
    let displayInCurrency = localStorage.getItem('display_in_currency');
    displayInCurrency = displayInCurrency === 'true';
    if (displayInCurrency) {
        return `(Equivalent Amount: ${renderQuota(quota, digits)})`;
    }
    return '';
}

const colors = ['amber', 'blue', 'cyan', 'green', 'grey', 'indigo',
    'light-blue', 'lime', 'orange', 'pink',
    'purple', 'red', 'teal', 'violet', 'yellow'
]

export const modelColorMap = {
    'dall-e': 'rgb(147,112,219)',  // Deep purple
    'dall-e-2': 'rgb(147,112,219)',  // Tone between purple and blue
    'dall-e-3': 'rgb(153,50,204)',  // Tone between violet and magenta
    'midjourney': 'rgb(136,43,180)',  // Tone between violet and magenta
    'gpt-3.5-turbo': 'rgb(184,227,167)',  // Light green
    'gpt-3.5-turbo-0301': 'rgb(131,220,131)',  // Bright green
    'gpt-3.5-turbo-0613': 'rgb(60,179,113)',  // Sea green
    'gpt-3.5-turbo-1106': 'rgb(32,178,170)',  // Light sea green
    'gpt-3.5-turbo-16k': 'rgb(252,200,149)',  // Light orange
    'gpt-3.5-turbo-16k-0613': 'rgb(255,181,119)',  // Light peach
    'gpt-3.5-turbo-instruct': 'rgb(175,238,238)',  // Powder blue
    'gpt-4': 'rgb(135,206,235)',  // Sky blue
    'gpt-4-0314': 'rgb(70,130,180)',  // Steel blue
    'gpt-4-0613': 'rgb(100,149,237)',  // Cornflower blue
    'gpt-4-1106-preview': 'rgb(30,144,255)',  // Dodger blue
    'gpt-4-0125-preview': 'rgb(2,177,236)',  // Deep sky blue
    'gpt-4-turbo-preview': 'rgb(2,177,255)',  // Deep sky blue
    'gpt-4-32k': 'rgb(104,111,238)',  // Medium purple
    'gpt-4-32k-0314': 'rgb(90,105,205)',  // Dark gray blue
    'gpt-4-32k-0613': 'rgb(61,71,139)',  // Dark blue gray
    'gpt-4-all': 'rgb(65,105,225)',  // Royal blue
    'gpt-4-gizmo-*': 'rgb(0,0,255)',  // Pure blue
    'gpt-4-vision-preview': 'rgb(25,25,112)',  // Midnight blue
    'text-ada-001': 'rgb(255,192,203)',  // Pink
    'text-babbage-001': 'rgb(255,160,122)',  // Light coral
    'text-curie-001': 'rgb(219,112,147)',  // Pale violet red
    'text-davinci-002': 'rgb(199,21,133)',  // Medium violet red
    'text-davinci-003': 'rgb(219,112,147)',  // Pale violet red (same as Curie, indicating same series)
    'text-davinci-edit-001': 'rgb(255,105,180)',  // Hot pink
    'text-embedding-ada-002': 'rgb(255,182,193)',  // Light pink
    'text-embedding-v1': 'rgb(255,174,185)',  // Light pink (slightly different)
    'text-moderation-latest': 'rgb(255,130,171)',  // Strong pink
    'text-moderation-stable': 'rgb(255,160,122)',  // Light coral (same as Babbage, indicating same type of function)
    'tts-1': 'rgb(255,140,0)',  // Dark orange
    'tts-1-1106': 'rgb(255,165,0)',  // Orange
    'tts-1-hd': 'rgb(255,215,0)',  // Gold
    'tts-1-hd-1106': 'rgb(255,223,0)',  // Golden yellow (slightly different)
    'whisper-1': 'rgb(245,245,220)'  // Beige
}

export function stringToColor(str) {
    let sum = 0;
    // Operate on each character in the string
    for (let i = 0; i < str.length; i++) {
        // Add the ASCII value of the character to sum
        sum += str.charCodeAt(i);
    }
    // Use modulo operation to get the digit
    let i = sum % colors.length;
    return colors[i];
}