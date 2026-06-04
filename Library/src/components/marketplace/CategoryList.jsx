// ============================================
// CategoryList.jsx - Trending Categories
// ============================================
import styles from "./CategoryList.module.css";
import { DUMMY_CATEGORIES } from "../../data/marketplaceData";

const CategoryList = ({ onCategorySelect, activeCategory }) => {
  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Trending Categories</h3>
        <button className={styles.seeAll} onClick={() => onCategorySelect?.(null)}>
          {activeCategory ? "Clear ✕" : "See All →"}
        </button>
      </div>

      <div className={styles.grid}>
        {DUMMY_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`category-${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
            className={`${styles.card} ${activeCategory === cat.name ? styles.active : ""}`}
            onClick={() => onCategorySelect?.(activeCategory === cat.name ? null : cat.name)}
            style={{ "--cat-color": cat.color }}
          >
            <div className={styles.iconWrapper} style={{ background: cat.bg }}>
              <span className={styles.emoji}>{cat.emoji}</span>
            </div>
            <span className={styles.name}>{cat.name}</span>
            <span className={styles.count}>{cat.count} books</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
