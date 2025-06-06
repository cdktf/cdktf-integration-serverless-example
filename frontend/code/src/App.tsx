/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

import React from "react";

import "./App.css";
import { CreatePostModal } from "./CreatePostModal";
import { Post } from "./Post";
import { usePosts } from "./api";

function App() {
  const [isModalOpen, setModalOpen] = React.useState(false);
  const openPostModal = () => { setModalOpen(true); };
  const closeModal = () => {
    setTimeout(triggerRefetch, 500);
    setModalOpen(false);
  };
  const { posts, error, triggerRefetch } = usePosts();

  if (error) {
    return <p>Error fetching posts: {JSON.stringify(error)}</p>;
  }

  return (
    <>
      <div>
        <a href="#/" className="post-modal-trigger" onClick={openPostModal}>
          Post new Item
        </a>
      </div>
      <div className="post-list">
        {posts.map((post) => (
          <Post key={post.id} {...post} />
        ))}
      </div>
      <CreatePostModal isModalOpen={isModalOpen} closeModal={closeModal} />
    </>
  );
}

export default App;
