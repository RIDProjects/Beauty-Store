-- Recalculate sales_count from actually delivered orders.
-- An old code version incremented sales_count at order CREATION, so
-- cancelled/pending orders left phantom "sold" units in products.

UPDATE products p SET sales_count = COALESCE((
  SELECT SUM(oi.quantity)
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE oi.product_id = p.id
    AND o.status IN ('delivered', 'completed')
), 0);
