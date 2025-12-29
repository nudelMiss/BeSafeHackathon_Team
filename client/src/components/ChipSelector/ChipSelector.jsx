import styles from './ChipSelector.module.css';

const ChipSelector = ({ options, onSelect, selectedValue }) => {
  return (
    <div className={styles.chipContainer}>
      {options.map((option, index) => (
        <button
          key={index}
          className={`${styles.chip} ${selectedValue === option ? styles.selected : ''}`}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default ChipSelector;

