class SecurePasswordGenerator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.clipboardTimer = null;
    }

    initializeElements() {
        this.lengthSlider = document.getElementById('lengthSlider');
        this.lengthValue = document.getElementById('lengthValue');
        this.passwordOutput = document.getElementById('passwordOutput');
        this.generateBtn = document.getElementById('generateBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.strengthText = document.getElementById('strengthText');
        this.entropyText = document.getElementById('entropyText');
        this.strengthFill = document.getElementById('strengthFill');
        this.clipboardStatus = document.getElementById('clipboardStatus');
        
        // Checkboxes
        this.includeUppercase = document.getElementById('includeUppercase');
        this.includeLowercase = document.getElementById('includeLowercase');
        this.includeNumbers = document.getElementById('includeNumbers');
        this.includeSymbols = document.getElementById('includeSymbols');
        this.avoidSimilar = document.getElementById('avoidSimilar');
        this.autoClipboard = document.getElementById('autoClipboard');
        this.excludeChars = document.getElementById('excludeChars');
    }

    attachEventListeners() {
        this.lengthSlider.addEventListener('input', () => {
            this.lengthValue.textContent = this.lengthSlider.value;
        });

        this.generateBtn.addEventListener('click', () => {
            this.generatePassword();
        });

        this.copyBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });

        // Auto-generate on option change
        const options = [
            this.includeUppercase, this.includeLowercase, 
            this.includeNumbers, this.includeSymbols, 
            this.avoidSimilar, this.excludeChars
        ];
        
        options.forEach(element => {
            element.addEventListener('change', () => {
                if (this.passwordOutput.value) {
                    this.generatePassword();
                }
            });
        });

        this.lengthSlider.addEventListener('change', () => {
            if (this.passwordOutput.value) {
                this.generatePassword();
            }
        });
    }

    getCharacterSets() {
        const sets = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        };

        // Characters that look similar
        const similarChars = '0O1lI';
        
        if (this.avoidSimilar.checked) {
            Object.keys(sets).forEach(key => {
                sets[key] = sets[key].split('').filter(char => 
                    !similarChars.includes(char)
                ).join('');
            });
        }

        // Remove custom excluded characters
        const excludeCustom = this.excludeChars.value;
        if (excludeCustom) {
            Object.keys(sets).forEach(key => {
                sets[key] = sets[key].split('').filter(char => 
                    !excludeCustom.includes(char)
                ).join('');
            });
        }

        return sets;
    }

    async generatePassword() { 
        const length = parseInt(this.lengthSlider.value);
        const sets = this.getCharacterSets();
        
        let availableChars = '';
        let requiredChars = '';

        // Build character set based on selections
        if (this.includeUppercase.checked && sets.uppercase) {
            availableChars += sets.uppercase;
            requiredChars += this.getSecureRandomChar(sets.uppercase);
        }
        
        if (this.includeLowercase.checked && sets.lowercase) {
            availableChars += sets.lowercase;
            requiredChars += this.getSecureRandomChar(sets.lowercase);
        }
        
        if (this.includeNumbers.checked && sets.numbers) {
            availableChars += sets.numbers;
            requiredChars += this.getSecureRandomChar(sets.numbers);
        }
        
        if (this.includeSymbols.checked && sets.symbols) {
            availableChars += sets.symbols;
            requiredChars += this.getSecureRandomChar(sets.symbols);
        }

        if (!availableChars) {
            alert('Please select at least one character type!');
            return;
        }

        // Generate password ensuring at least one character from each selected type
        let password = requiredChars;
        
        // Fill remaining length with random characters
        for (let i = requiredChars.length; i < length; i++) {
            password += this.getSecureRandomChar(availableChars);
        }

        // Shuffle the password to randomize required character positions
        password = this.shuffleString(password);

        this.passwordOutput.value = password;
        this.copyBtn.disabled = false;
        this.updateStrengthMeter(password, availableChars.length);
    }

    getSecureRandomChar(charset) {
        if (!charset) return '';
        
        // Use Web Crypto API for cryptographically secure randomness
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        
        // Ensure uniform distribution
        const randomIndex = array[0] % charset.length;
        return charset[randomIndex];
    }

    shuffleString(str) {
        const array = str.split('');
        
        // Fisher-Yates shuffle with crypto random
        for (let i = array.length - 1; i > 0; i--) {
            const randomArray = new Uint32Array(1);
            window.crypto.getRandomValues(randomArray);
            const j = randomArray[0] % (i + 1);
            
            [array[i], array[j]] = [array[j], array[i]];
        }
        
        return array.join('');
    }

    calculateEntropy(password, charsetSize) {
        // Entropy = log2(charsetSize^passwordLength)
        return Math.log2(Math.pow(charsetSize, password.length));
    }

    updateStrengthMeter(password, charsetSize) {
        const entropy = this.calculateEntropy(password, charsetSize);
        
        let strength, percentage, className;
        
        if (entropy < 40) {
            strength = 'Weak';
            percentage = 25;
            className = 'strength-weak';
        } else if (entropy < 60) {
            strength = 'Fair';
            percentage = 50;
            className = 'strength-fair';
        } else if (entropy < 80) {
            strength = 'Good';
            percentage = 75;
            className = 'strength-good';
        } else {
            strength = 'Strong';
            percentage = 100;
            className = 'strength-strong';
        }

        this.strengthText.textContent = `Password Strength: ${strength}`;
        this.entropyText.textContent = `Entropy: ${Math.round(entropy)} bits`;
        
        this.strengthFill.style.width = `${percentage}%`;
        this.strengthFill.className = `strength-fill ${className}`;
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.passwordOutput.value);
            
            this.clipboardStatus.textContent = '✓ Password copied to clipboard!';
            this.clipboardStatus.className = 'clipboard-success';
            
            // Auto-clear clipboard if option is enabled
            if (this.autoClipboard.checked) {
                this.startClipboardTimer();
            }
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                if (!this.autoClipboard.checked) {
                    this.clipboardStatus.textContent = '';
                }
            }, 3000);
            
        } catch (err) {
            this.clipboardStatus.textContent = '❌ Failed to copy password';
            this.clipboardStatus.className = 'clipboard-warning';
            
            setTimeout(() => {
                this.clipboardStatus.textContent = '';
            }, 3000);
        }
    }

    startClipboardTimer() {
        // Clear any existing timer
        if (this.clipboardTimer) {
            clearTimeout(this.clipboardTimer);
        }
        
        let countdown = 15;
        this.clipboardStatus.textContent = `🔒 Clipboard will auto-clear in ${countdown} seconds`;
        this.clipboardStatus.className = 'clipboard-warning';
        
        const countdownInterval = setInterval(() => {
            countdown--;
            this.clipboardStatus.textContent = `🔒 Clipboard will auto-clear in ${countdown} seconds`;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        // Clear clipboard after 15 seconds
        this.clipboardTimer = setTimeout(async () => {
            try {
                await navigator.clipboard.writeText('');
                this.clipboardStatus.textContent = '🔒 Clipboard cleared for security';
                this.clipboardStatus.className = 'clipboard-success';
                
                setTimeout(() => {
                    this.clipboardStatus.textContent = '';
                }, 3000);
                
            } catch (err) {
                console.warn('Could not clear clipboard:', err);
            }
        }, 15000);
    }
}

// Initialize the password generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SecurePasswordGenerator();
});
