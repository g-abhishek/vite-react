import axios from "axios";
import { useEffect, useState } from "react";
import "./index.css";

const InfiniteScroll = () => {
  const [posts, setPosts] = useState([]);
  const fetchPosts = async ({ skip = 0, limit = 10 }) => {
    const res = await axios.get(
      `https://dummyjson.com/products?limit=${limit}&skip=${skip}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const { products } = res.data;

    setPosts(products);
  };

  useEffect(() => {
    fetchPosts({ page: 1, limit: 20 });
  }, []);

  return (
    <>
      <div className="container">
        {posts?.map((post) => (
          <div className="card">
            <div className="card-image">
              <div className="image-container"></div>
            </div>
            <div className="card-body">
              <p className="card-title">{post.title}</p>
              <div className="card-descriptions-1">
                <p>
                  Brand: <span>{post.brand}</span>
                </p>
                <p>
                  Category: <span>{post.category}</span>
                </p>
                <p>
                  SKU: <span>{post.sku}</span>
                </p>
              </div>
            </div>
            <div className="card-action"></div>
          </div>
        ))}
      </div>
    </>
  );
};

export default InfiniteScroll;
