import styles from './ChipSelector.module.css';

const ChipSelector = ({ options, onSelect, selectedValue, multiple = false }) => {
  // Handle multiple selection
  const handleClick = (option) => {
    if (multiple) {
      // For multiple selection, selectedValue should be an array
      const currentSelections = Array.isArray(selectedValue) ? selectedValue : [];
      const isSelected = currentSelections.includes(option);
      
      if (isSelected) {
        // Remove from selection
        const newSelections = currentSelections.filter(item => item !== option);
        onSelect(newSelections);
      } else {
        // Add to selection
        const newSelections = [...currentSelections, option];
        onSelect(newSelections);
      }
    } else {
      // Single selection (original behavior)
      onSelect(option);
    }
  };

  return (
    <div className={styles.chipContainer}>
      {options.map((option, index) => {
        // Check if this specific option is selected (works for both single and multiple)
        const isSelected = multiple
          ? Array.isArray(selectedValue) && selectedValue.includes(option)
          : selectedValue === option;

        return (
          <button
            key={index}
            className={`${styles.chip} ${isSelected ? styles.selected : ''}`}
            onClick={() => handleClick(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export default ChipSelector;
